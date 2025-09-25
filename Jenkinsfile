pipeline {
  agent any

  environment {
    REGISTRY   = 'ghcr.io'
    OWNER      = 'musclebeaver'
    APP        = 'smartcane-frontend'
    IMAGE_BASE = "${REGISTRY}/${OWNER}/${APP}"

    WEB_HOST     = '10.10.10.40'
    WEB_SSH_PORT = '30022'
  }

  options { timestamps(); disableConcurrentBuilds(); ansiColor('xterm') }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build & Push (GHCR)') {
      steps {
        withCredentials([string(credentialsId: 'smartcane-ghcr', variable: 'GH_PAT')]) {
          script {
            def branch  = env.BRANCH_NAME ?: 'local'
            def channel = (branch == 'main') ? 'prod'
                         : (branch == 'dev')  ? 'dev'
                         : branch.replaceAll('[^a-zA-Z0-9_.-]','-')
            env.CHANNEL = channel

            sh """
              set -euo pipefail
              echo "\$GH_PAT" | docker login ${REGISTRY} -u "${OWNER}" --password-stdin

              docker build \\
                --build-arg VITE_API_BASE_URL=http://10.20.10.40:8081 \\
                -t ${IMAGE_BASE}:${channel}-${BUILD_NUMBER} \\
                -t ${IMAGE_BASE}:${channel} \\
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
                              usernameVariable: 'SSH_USER')
          ]) {
            sh """
              set -euo pipefail

              # 원격에서 bash로 실행하고, 스크립트를 표준입력(heredoc)으로 전달
              ssh -i "\$SSH_KEY" -T -o StrictHostKeyChecking=no -p ${WEB_SSH_PORT} ${SSH_USER}@${WEB_HOST} bash -s <<EOSSH
      set -Eeuo pipefail

      # --- Jenkins에서 전달한 값들을 원격 변수로 고정 ---
      GH_PAT='${GH_PAT}'
      OWNER='${OWNER}'
      REGISTRY='${REGISTRY}'
      IMAGE='${IMAGE_BASE}:${CHANNEL}'
      NAME='${APP}-${CHANNEL}'
      CHANNEL='${CHANNEL}'

      # GHCR 로그인 & pull
      echo "\$GH_PAT" | docker login "\$REGISTRY" -u "\$OWNER" --password-stdin
      docker pull "\$IMAGE"

      # 기존 컨테이너 정리
      if [ "\$(docker ps -aq -f name=^\\\${NAME}\\\$)" ]; then
        docker rm -f "\$NAME" || true
      fi

      # 포트: prod=80, 나머지=8080
      PORT="-p 80:80"
      if [ "\$CHANNEL" != "prod" ]; then
        PORT="-p 8080:80"
      fi

      # 실행
      docker run -d --name "\$NAME" --restart=always \$PORT "\$IMAGE"

      # 헬스체크
      sleep 2
      if [ "\$CHANNEL" = "prod" ]; then
        curl -I -sS http://127.0.0.1/ | head -n 1
      else
        curl -I -sS http://127.0.0.1:8080/ | head -n 1
      fi

      # 이미지 정리
      docker image prune -f >/dev/null 2>&1 || true
      EOSSH
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
