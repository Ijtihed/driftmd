package main

import "os"

func main() {
    port := os.Getenv("PORT")
    dbUrl := os.Getenv("DATABASE_URL")
    _ = port
    _ = dbUrl
}
