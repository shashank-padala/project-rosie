FROM griffithlab/pvactools:latest

# Install tcsh (required by NetMHCpan wrapper script)
RUN apt-get update && apt-get install -y --no-install-recommends tcsh && rm -rf /var/lib/apt/lists/*

# Install NetMHCpan 4.2
COPY netMHCpan-4.2cstatic.Linux.tar.gz /tmp/
RUN tar -xzf /tmp/netMHCpan-4.2cstatic.Linux.tar.gz -C /opt/ \
    && rm /tmp/netMHCpan-4.2cstatic.Linux.tar.gz \
    # Patch the installation path in the wrapper script
    && sed -i 's|setenv\s*NMHOME.*|setenv NMHOME /opt/netMHCpan-4.2|' /opt/netMHCpan-4.2/netMHCpan \
    # Make binary executable and symlink as netMHCpan in PATH
    && chmod +x /opt/netMHCpan-4.2/Linux_x86_64/bin/netMHCpan-4.2 \
    && chmod +x /opt/netMHCpan-4.2/netMHCpan \
    && ln -s /opt/netMHCpan-4.2/netMHCpan /usr/local/bin/netMHCpan

ENV NMHOME=/opt/netMHCpan-4.2
ENV TMPDIR=/tmp

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY modules/ ./modules/
COPY run_pipeline.py .
COPY run_cloud.py .

ENV VEP_CACHE_DIR=/vep_cache
ENV PYTHONUNBUFFERED=1

ENTRYPOINT ["python", "run_cloud.py"]
