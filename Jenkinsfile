pipeline {
    agent any

    stages {
        stage('Build Backend Image') {
            steps {
                sh 'docker build -t metinanaliz-backend:latest ./backend'
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh 'docker build -t metinanaliz-frontend:latest ./frontend'
            }
        }
    }
}
