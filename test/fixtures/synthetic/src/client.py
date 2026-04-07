class APIClient:
    def query(self, sql: str, timeout: int = 30, retries: int = 3):
        """Execute a query."""
        pass

    def connect(self, host: str, port: int = 5432, ssl: bool = True):
        """Connect to database."""
        pass

def helper(x: int, y: int = 10):
    return x + y
