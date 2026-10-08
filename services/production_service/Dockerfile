FROM python:3.11-slim
WORKDIR /app
COPY common ./common
COPY services/production_service ./services/production_service
EXPOSE 8002
CMD ["python", "-m", "services.production_service.main"]
