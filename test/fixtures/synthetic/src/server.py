import os
import click

db_url = os.environ.get("DATABASE_URL", "localhost")
api_key = os.getenv("API_KEY")
redis_url = os.environ["REDIS_URL"]

@click.command()
@click.option('--host', '-h', default='localhost', help='Server host')
@click.option('--port', '-p', default=8080, help='Server port')
@click.option('--workers', '-w', default=4, help='Number of workers')
@click.option('--reload', is_flag=True, help='Enable auto-reload')
def serve(host, port, workers, reload):
    print(f"Starting on {host}:{port}")
