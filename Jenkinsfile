pipeline {
    agent {
        label 'production'
    }

    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REGISTRY = '348389439375.dkr.ecr.ap-south-1.amazonaws.com'
        IMAGE_NAME = '348389439375.dkr.ecr.ap-south-1.amazonaws.com/wanderlust-app'
        CONTAINER_NAME = 'wanderlust-app'
        ENV_FILE = '/home/ubuntu/wanderlust.env'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    echo "Building Wanderlust Docker image..."

                    docker build \
                        -t ${IMAGE_NAME}:latest \
                        .
                '''
            }
        }

        stage('ECR Login') {
            steps {
                sh '''
                    echo "Logging in to Amazon ECR..."

                    aws ecr get-login-password \
                        --region ${AWS_REGION} \
                    | docker login \
                        --username AWS \
                        --password-stdin ${ECR_REGISTRY}
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                sh '''
                    echo "Pushing image to ECR..."

                    docker push ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Deploy') {
    steps {
        sh '''
            echo "Deploying Wanderlust..."

            docker pull ${IMAGE_NAME}:latest

            # Save currently running image for rollback
            OLD_IMAGE=$(docker inspect --format='{{.Config.Image}}' ${CONTAINER_NAME} 2>/dev/null || true)

            docker stop ${CONTAINER_NAME} || true
            docker rm ${CONTAINER_NAME} || true

            docker run -d \
                --name ${CONTAINER_NAME} \
                --restart unless-stopped \
                --env-file ${ENV_FILE} \
                -p 8181:8181 \
                ${IMAGE_NAME}:latest

            echo "Waiting for application to start..."
            sleep 10

            echo "Running health check..."

            if curl --fail --silent http://127.0.0.1:8181/health > /dev/null; then
                echo "Health check PASSED."
                echo "Deployment successful."
            else
                echo "Health check FAILED."
                echo "Rolling back..."

                docker logs --tail 50 ${CONTAINER_NAME} || true

                docker stop ${CONTAINER_NAME} || true
                docker rm ${CONTAINER_NAME} || true

                if [ -n "$OLD_IMAGE" ]; then
                    echo "Starting previous image: $OLD_IMAGE"

                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        --env-file ${ENV_FILE} \
                        -p 8181:8181 \
                        ${OLD_IMAGE}

                    sleep 10

                    if curl --fail --silent http://127.0.0.1:8181/health > /dev/null; then
                        echo "Rollback successful."
                    else
                        echo "Rollback health check FAILED."
                        exit 1
                    fi
                else
                    echo "No previous image available for rollback."
                    exit 1
                fi
            fi

            docker ps --filter name=${CONTAINER_NAME}
        '''
    }
}
    }

    post {
        success {
            echo 'Wanderlust deployment successful!'
        }

        failure {
            echo 'Wanderlust deployment failed!'
        }
    }
}
