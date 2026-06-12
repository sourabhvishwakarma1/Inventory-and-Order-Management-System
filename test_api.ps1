$baseUrl = "http://localhost:8001"

function Test-Api {
    param([string]$Method, [string]$Url, [string]$Body)
    try {
        if ($Body) {
            $r = Invoke-WebRequest -Uri $Url -Method $Method -ContentType "application/json" -Body $Body -UseBasicParsing
        } else {
            $r = Invoke-WebRequest -Uri $Url -Method $Method -UseBasicParsing
        }
        return @{ Status = $r.StatusCode; Content = $r.Content }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        return @{ Status = $code; Content = $content }
    }
}

Write-Host "`n=== TEST 1: Duplicate SKU ===" -ForegroundColor Cyan
$body = @{ name="Test Product"; sku="WBH-001"; price=10; stock_quantity=5 } | ConvertTo-Json
$r = Test-Api -Method POST -Url "$baseUrl/api/products" -Body $body
Write-Host "Status: $($r.Status) | Response: $($r.Content)"

Write-Host "`n=== TEST 2: Duplicate Email ===" -ForegroundColor Cyan
$body = @{ name="Test User"; email="alice.johnson@email.com" } | ConvertTo-Json
$r = Test-Api -Method POST -Url "$baseUrl/api/customers" -Body $body
Write-Host "Status: $($r.Status) | Response: $($r.Content)"

Write-Host "`n=== TEST 3: Create Order (valid) ===" -ForegroundColor Cyan
$body = @{
    customer_id = 1
    items = @( @{ product_id = 1; quantity = 2 } )
} | ConvertTo-Json -Depth 3
$r = Test-Api -Method POST -Url "$baseUrl/api/orders" -Body $body
Write-Host "Status: $($r.Status)"
if ($r.Content) {
    $order = $r.Content | ConvertFrom-Json
    Write-Host "Order ID: $($order.id), Total: $($order.total_amount), Status: $($order.status)"
}

Write-Host "`n=== TEST 4: Check stock reduced ===" -ForegroundColor Cyan
$r = Test-Api -Method GET -Url "$baseUrl/api/products/1"
if ($r.Content) {
    $prod = $r.Content | ConvertFrom-Json
    Write-Host "Product: $($prod.name), Stock: $($prod.stock_quantity) (was 150, should be 148)"
}

Write-Host "`n=== TEST 5: Insufficient stock order (Notebook Journal, stock=0) ===" -ForegroundColor Cyan
$body = @{
    customer_id = 1
    items = @( @{ product_id = 12; quantity = 5 } )
} | ConvertTo-Json -Depth 3
$r = Test-Api -Method POST -Url "$baseUrl/api/orders" -Body $body
Write-Host "Status: $($r.Status) | Response: $($r.Content)"

Write-Host "`n=== TEST 6: Dashboard stats ===" -ForegroundColor Cyan
$r = Test-Api -Method GET -Url "$baseUrl/api/dashboard/stats"
Write-Host "Status: $($r.Status) | Response: $($r.Content)"

Write-Host "`n=== ALL TESTS COMPLETE ===" -ForegroundColor Green
