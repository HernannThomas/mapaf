FROM python:3.11-slim
WORKDIR /app
COPY common ./common
COPY services/gateway_service ./services/gateway_service
EXPOSE 8000
CMD ["python", "-m", "services.gateway_service.main"]
