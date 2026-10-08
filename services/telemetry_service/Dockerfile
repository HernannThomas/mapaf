FROM python:3.11-slim
WORKDIR /app
COPY common ./common
COPY services/telemetry_service ./services/telemetry_service
EXPOSE 8001
CMD ["python", "-m", "services.telemetry_service.main"]
