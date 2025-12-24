# Database Setup PowerShell Script
$env:PGPASSWORD = "1234"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$dbName = "dms_db_test"

Write-Host "Checking if database exists..." -ForegroundColor Yellow

$dbExists = & $psql -U postgres -h localhost -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName';"

if ($dbExists -eq "1") {
    Write-Host "Database $dbName already exists. Dropping it..." -ForegroundColor Yellow
    & $psql -U postgres -h localhost -p 5432 -d postgres -c "DROP DATABASE $dbName;"
}

Write-Host "Creating database $dbName..." -ForegroundColor Green
& $psql -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE $dbName;"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database created successfully!" -ForegroundColor Green

    Write-Host "Executing schema.sql..." -ForegroundColor Yellow
    & $psql -U postgres -h localhost -p 5432 -d $dbName -f "$PSScriptRoot\schema.sql"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "Database setup completed successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "`nDatabase: $dbName"
        Write-Host "Host: localhost"
        Write-Host "Port: 5432"
        Write-Host "User: postgres"
    } else {
        Write-Host "Error executing schema!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Error creating database!" -ForegroundColor Red
    exit 1
}
