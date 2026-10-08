FROM python:3.11-slim
WORKDIR /app
COPY common ./common
COPY services/alerts_service ./services/alerts_service
EXPOSE 8003
CMD ["python", "-m", "services.alerts_service.main"]
