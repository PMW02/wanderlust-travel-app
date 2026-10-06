pipeline {
    agent {
        label 'production'
    }

    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REGISTRY = '348389439375.dkr.ecr.ap-south-1.amazonaws.com'
        IMAGE_REPO = '348389439375.dkr.ecr.ap-south-1.amazonaws.com/wanderlust-app'
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
                    echo "Building Wanderlust image..."

                    docker build \
                        -t ${IMAGE_REPO}:candidate \
                        .

                    echo "Docker build completed."
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

        stage('Prepare Rollback') {
            steps {
                sh '''
                    echo "Preparing rollback image..."

                    if docker manifest inspect ${IMAGE_REPO}:latest > /dev/null 2>&1; then

                        docker pull ${IMAGE_REPO}:latest

                        docker tag \
                            ${IMAGE_REPO}:latest \
                            ${IMAGE_REPO}:rollback

                        docker push ${IMAGE_REPO}:rollback

                        echo "Previous latest saved as rollback."

                    else
                        echo "No existing latest image found."
                        echo "Skipping rollback preparation."
                    fi
                '''
            }
        }

        stage('Promote Candidate') {
            steps {
                sh '''
                    echo "Promoting candidate image to latest..."

                    docker tag \
                        ${IMAGE_REPO}:candidate \
                        ${IMAGE_REPO}:latest

                    docker push ${IMAGE_REPO}:latest

                    echo "New image pushed as latest."
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    echo "Deploying latest image..."

                    docker pull ${IMAGE_REPO}:latest

                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true

                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        --env-file ${ENV_FILE} \
                        -p 8181:8181 \
                        ${IMAGE_REPO}:latest

                    echo "Waiting for application..."
                    sleep 10

                    echo "Running health check..."

                    if curl --fail --silent \
                        --max-time 10 \
                        http://127.0.0.1:8181/health > /dev/null
                    then
                        echo "Health check PASSED."
                        echo "Deployment successful."

                    else
                        echo "Health check FAILED."
                        echo "Starting automatic rollback..."

                        docker logs --tail 50 ${CONTAINER_NAME} || true

                        docker stop ${CONTAINER_NAME} || true
                        docker rm ${CONTAINER_NAME} || true

                        docker pull ${IMAGE_REPO}:rollback

                        docker run -d \
                            --name ${CONTAINER_NAME} \
                            --restart unless-stopped \
                            --env-file ${ENV_FILE} \
                            -p 8181:8181 \
                            ${IMAGE_REPO}:rollback

                        echo "Waiting for rollback..."
                        sleep 10

                        if curl --fail --silent \
                            --max-time 10 \
                            http://127.0.0.1:8181/health > /dev/null
                        then
                            echo "Rollback successful."
                        else
                            echo "CRITICAL: Rollback health check FAILED."
                            docker logs --tail 50 ${CONTAINER_NAME} || true
                            exit 1
                        fi
                    fi

                    docker ps --filter name=${CONTAINER_NAME}
                '''
            }
        }

        stage('Cleanup Local Images') {
            steps {
                sh '''
                    echo "Cleaning temporary local images..."

                    docker rmi ${IMAGE_REPO}:candidate || true

                    echo "Local cleanup completed."
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
