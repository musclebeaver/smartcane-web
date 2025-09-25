pipeline {
  agent any

  environment {
    REGISTRY    = "ghcr.io"
    OWNER       = "musclebeaver"                  // GitHub 계정/조직
    APP         = "smartcane-frontend"            // 이미지 이름
    IMAGE_BASE  = "${REGISTRY}/${OWNER}/${APP}"

    WEB_HOST     = "10.10.10.40"                  // Web 서버 프라이빗 IP
    WEB_SSH_PORT = "30022"                        // SSH 포트
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
            // 브랜치 → 채널(prod/dev/기타-브랜치명)
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
                            usernameVariable: 'SSH_USER')   // 예: smartcane
        ]) {
          // ⚠️ 아래 sh 블록 안의 heredoc(EOSSH)은 꼭 "맨 왼쪽(컬럼 1)"에 놓으세요. 앞에 공백/탭 넣지 마세요.
          sh """
set -euo pipefail

ssh -i "\$SSH_KEY" -T -o StrictHostKeyChecking=no -p ${WEB_SSH_PORT} ${SSH_USER}@${WEB_HOST} bash -s <<EOSSH
set -Eeuo pipefail

# --- 원격에서 사용할 값들을 "로컬에서" 주입 (여기는 로컬 확장 허용) ---
GH_PAT="$GH_PAT"
OWNER="$OWNER"
REGISTRY="$REGISTRY"
IMAGE="$IMAGE_BASE:$CHANNEL"
NAME="$APP-$CHANNEL"
CHANNEL="$CHANNEL"

# --- 여기부터는 \$로 이스케이프된 원격 변수만 사용 (로컬 확장 방지) ---
echo "\\\$GH_PAT" | docker login "\\\$REGISTRY" -u "\\\$OWNER" --password-stdin
docker pull "\\\$IMAGE"

# 기존 컨테이너 강제 제거 (있으면)
if [ "\\\$(docker ps -aq -f name=^\\\${NAME}\\\$)" ]; then
  docker rm -f "\\\$NAME" || true
fi

# 포트: prod=80, 비-prod=8080
PORT="-p 80:80"
if [ "\\\$CHANNEL" != "prod" ]; then
  PORT="-p 8080:80"
fi

# 새 컨테이너 실행
docker run -d --name "\\\$NAME" --restart=always \\\$PORT "\\\$IMAGE"

# 헬스체크
sleep 2
if [ "\\\$CHANNEL" = "prod" ]; then
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
          echo "✅ 배포 성공: http://${WEB_HOST}/"
        } else {
          echo "✅ 배포 성공(dev/feature): http://${WEB_HOST}:8080/"
        }
      }
    }
    failure { echo "❌ 배포 실패 - 콘솔 로그 확인하세요" }
  }
}
