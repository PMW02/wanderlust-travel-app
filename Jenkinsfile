pipeline {
    agent {
        label 'production'
    }

    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REGISTRY = '348389439375.dkr.ecr.ap-south-1.amazonaws.com'
        ECR_REPOSITORY = 'wanderlust-app'
        IMAGE_NAME = '348389439375.dkr.ecr.ap-south-1.amazonaws.com/wanderlust-app'
        CONTAINER_NAME = 'wanderlust-app'
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

      
