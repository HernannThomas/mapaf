FROM python:3.11-slim
WORKDIR /app
COPY common ./common
COPY services/assets_service ./services/assets_service
EXPOSE 8004
CMD ["python", "-m", "services.assets_service.main"]
