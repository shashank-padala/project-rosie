FROM griffithlab/pvactools:latest

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY modules/ ./modules/
COPY run_pipeline.py .

ENV VEP_CACHE_DIR=/vep_cache
ENV PYTHONUNBUFFERED=1

ENTRYPOINT ["python", "run_pipeline.py"]
