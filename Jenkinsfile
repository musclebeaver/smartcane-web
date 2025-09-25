pipeline {
  agent any
  environment {
    REGISTRY   = "ghcr.io"
    OWNER      = "musclebeaver"
    APP        = "smartcane-frontend"
    IMAGE_BASE = "${REGISTRY}/${OWNER}/${APP}"
    CHANNEL    = "prod"   // 브랜치 따라 분기하려면 logic 추가 가능
    WEB_HOST   = "10.10.10.40"
    WEB_SSH_PORT = "30022"
  }

  options { timestamps(); disableConcurrentBuilds() }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build & Push (GHCR)') {
      steps {
        withCredentials([string(credentialsId: 'smartcane-ghcr', variable: 'GH_PAT')]) {
          script {
            sh '''
              set -euo pipefail
              echo "$GH_PAT" | docker login ghcr.io -u "$OWNER" --password-stdin
              docker build \
                --build-arg VITE_API_BASE_URL=http://10.20.10.40:8081 \
                -t ${IMAGE_BASE}:${CHANNEL}-${BUILD_NUMBER} \
                -t ${IMAGE_BASE}:${CHANNEL} \
                .
              docker push ${IMAGE_BASE}:${CHANNEL}-${BUILD_NUMBER}
              docker push ${IMAGE_BASE}:${CHANNEL}
            '''
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

            ssh -i "\$SSH_KEY" -T -o StrictHostKeyChecking=no -p ${WEB_SSH_PORT} ${SSH_USER}@${WEB_HOST} bash -s <<'EOSSH'
set -Eeuo pipefail

GH_PAT='${GH_PAT}'
OWNER='${OWNER}'
REGISTRY='${REGISTRY}'
IMAGE='${IMAGE_BASE}:${CHANNEL}'
NAME='${APP}-${CHANNEL}'
CHANNEL='${CHANNEL}'

echo "\$GH_PAT" | docker login "\$REGISTRY" -u "\$OWNER" --password-stdin
docker pull "\$IMAGE"

if [ "\$(docker ps -aq -f name=^\\\${NAME}\\\$)" ]; then
  docker rm -f "\$NAME" || true
fi

PORT="-p 80:80"
if [ "\$CHANNEL" != "prod" ]; then
  PORT="-p 8080:80"
fi

docker run -d --name "\$NAME" --restart=always \$PORT "\$IMAGE"

sleep 2
if [ "\$CHANNEL" = "prod" ]; then
  curl -I -sS http://127.0.0.1/ | head -n 1
else
  curl -I -sS http://127.0.0.1:8080/ | head -n 1
fi

docker image prune -f >/dev/null 2>&1 || true
EOSSH
          """
        }
      }
    }
  }

  post {
    success { echo "🎉 배포 성공: ${env.IMAGE_BASE}:${env.CHANNEL}-${env.BUILD_NUMBER}" }
    failure { echo "❌ 배포 실패 - 콘솔 로그 확인하세요" }
  }
}
