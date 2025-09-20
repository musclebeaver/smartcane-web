pipeline {
    agent {
        docker {
            image 'node:20-alpine'
            args '-u root:root -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    options {
        skipDefaultCheckout(true)
        timestamps()
    }
    environment {
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Archive') {
            steps {
                stash includes: 'dist/**', name: 'dist-artifacts', useDefaultExcludes: false, allowEmpty: true
            }
        }
        stage('Docker') {
            when {
                beforeAgent true
                allOf {
                    expression { fileExists('Dockerfile') }
                    expression { return env.ENABLE_DOCKER ? env.ENABLE_DOCKER.toBoolean() : true }
                }
            }
            steps {
                sh 'docker build -t smartcane-web:${BUILD_NUMBER} .'
                script {
                    if (env.DOCKER_REGISTRY?.trim()) {
                        withCredentials([
                            usernamePassword(
                                credentialsId: env.DOCKER_CREDENTIALS_ID ?: 'docker-registry',
                                usernameVariable: 'DOCKER_USERNAME',
                                passwordVariable: 'DOCKER_PASSWORD'
                            )
                        ]) {
                            sh """
                                echo "\$DOCKER_PASSWORD" | docker login -u "\$DOCKER_USERNAME" ${env.DOCKER_REGISTRY} --password-stdin
                                docker tag smartcane-web:${env.BUILD_NUMBER} ${env.DOCKER_REGISTRY}/smartcane-web:${env.BUILD_NUMBER}
                                docker push ${env.DOCKER_REGISTRY}/smartcane-web:${env.BUILD_NUMBER}
                            """
                        }
                    }
                }
            }
        }
    }
    post {
        success {
            archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true, fingerprint: true
        }
        always {
            cleanWs()
        }
    }
}
