pipeline {
  agent any

  environment {
    REGISTRY   = 'ghcr.io'
    OWNER      = 'musclebeaver'                 // GitHub org/user
    APP        = 'smartcane-frontend'           // 이미지 이름
    IMAGE_BASE = "${REGISTRY}/${OWNER}/${APP}"

    WEB_HOST     = '10.10.10.40'                // Web 서버 프라이빗 IP
    WEB_SSH_PORT = '30022'                      // SSH 포트
  }

  options { timestamps(); disableConcurrentBuilds(); ansiColor('xterm') }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build & Push (GHCR)') {
      steps {
        // NOTE: smartcane-ghcr = Secret text (PAT)
        withCredentials([string(credentialsId: 'smartcane-ghcr', variable: 'GH_PAT')]) {
          script {
            // 브랜치 → 채널 태깅 규칙
            def branch  = env.BRANCH_NAME ?: 'local'
            def channel = (branch == 'main') ? 'prod'
                         : (branch == 'dev')  ? 'dev'
                         : branch.replaceAll('[^a-zA-Z0-9_.-]','-')
            env.CHANNEL = channel

            sh """
              set -euo pipefail
              echo "\$GH_PAT" | docker login ${REGISTRY} -u "${OWNER}" --password-stdin

              docker build \
                -t ${IMAGE_BASE}:${channel}-${BUILD_NUMBER} \
                -t ${IMAGE_BASE}:${channel} \
                .

              docker push ${IMAGE_BASE}:${channel}-${BUILD_NUMBER}
              docker push ${IMAGE_BASE}:${channel}
            """
          }
        }
      }
    }

  stage('Deploy to Web') {
    steps {
      withCredentials([
        string(credentialsId: 'smartcane-ghcr', variable: 'GH_PAT'),
        sshUserPrivateKey(credentialsId: 'web_ssh_smartcane',
                          keyFileVariable: 'SSH_KEY',
                          usernameVariable: 'SSH_USER')   // smartcane
      ]) {
        sh """
          set -euo pipefail
          ssh -i "\$SSH_KEY" -o StrictHostKeyChecking=no -p ${WEB_SSH_PORT} ${SSH_USER}@${WEB_HOST} '
            set -euo pipefail

            IMAGE="${IMAGE_BASE}:${CHANNEL}"
            NAME="${APP}-${CHANNEL}"

            # GHCR 로그인 & pull
            echo "${GH_PAT}" | docker login ${REGISTRY} -u "${OWNER}" --password-stdin
            docker pull "\$IMAGE"

            # 기존 컨테이너 정리
            if [ "\\\$(docker ps -aq -f name=^\\\${NAME}\\\$)" ]; then
              docker rm -f "\$NAME" || true
            fi

            # 포트: prod=80, 그외=8080
            PORT="-p 80:80"
            if [ "${CHANNEL}" != "prod" ]; then
              PORT="-p 8080:80"
            fi

            # 실행
            docker run -d --name "\$NAME" --restart=always \$PORT "\$IMAGE"

            # 헬스체크
            sleep 2
            if [ "${CHANNEL}" = "prod" ]; then
              curl -I -sS http://127.0.0.1/ | head -n 1
            else
              curl -I -sS http://127.0.0.1:8080/ | head -n 1
            fi

            # 이미지 정리
            docker image prune -f >/dev/null 2>&1 || true
          '
        """
      }
    }
  }
  }

  post {
    success {
      script {
        if (env.CHANNEL == 'prod') {
          echo "✅ 배포 성공: http://10.10.10.40/"
        } else {
          echo "✅ 배포 성공(dev/feature): http://10.10.10.40:8080/"
        }
      }
    }
    failure { echo "❌ 배포 실패 - 콘솔 로그를 확인하세요" }
  }
}
