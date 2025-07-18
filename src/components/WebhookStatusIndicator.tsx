import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WebhookService } from '@/services/webhookService'
import { CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react'

interface WebhookStatus {
  isConnected: boolean
  lastChecked: Date
  responseTime?: number
  error?: string
}

export function WebhookStatusIndicator() {
  const [status, setStatus] = useState<WebhookStatus>({
    isConnected: false,
    lastChecked: new Date(),
  })
  const [isChecking, setIsChecking] = useState(false)
  const webhookService = WebhookService.getInstance()

  const checkWebhookStatus = useCallback(async () => {
    setIsChecking(true)
    
    try {
      const healthResult = await webhookService.healthCheck()
      
      setStatus({
        isConnected: healthResult.healthy,
        lastChecked: new Date(),
        responseTime: healthResult.responseTime,
        error: healthResult.healthy ? undefined : healthResult.message
      })
    } catch (error) {
      setStatus({
        isConnected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsChecking(false)
    }
  }, [webhookService])

  useEffect(() => {
    // Check status on mount
    checkWebhookStatus()
    
    // Check every 30 seconds
    const interval = setInterval(checkWebhookStatus, 30000)
    return () => clearInterval(interval)
  }, [checkWebhookStatus])

  const getStatusColor = () => {
    if (isChecking) return 'secondary'
    return status.isConnected ? 'default' : 'destructive'
  }

  const getStatusIcon = () => {
    if (isChecking) return <Loader2 className="h-3 w-3 animate-spin" />
    return status.isConnected ? (
      <CheckCircle className="h-3 w-3 text-green-500" />
    ) : (
      <XCircle className="h-3 w-3 text-red-500" />
    )
  }

  const getStatusText = () => {
    if (isChecking) return 'Checking...'
    return status.isConnected ? 'Connected' : 'Disconnected'
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {status.isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          Webhook Status
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkWebhookStatus}
            disabled={isChecking}
            className="h-6 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Last checked:</span>
            <span>{status.lastChecked.toLocaleTimeString('id-ID')}</span>
          </div>
          {status.responseTime && (
            <div className="flex justify-between">
              <span>Response time:</span>
              <span>{status.responseTime}ms</span>
            </div>
          )}
        </div>
        
        {status.error && (
          <Alert className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {status.error}
            </AlertDescription>
          </Alert>
        )}
        
        {!status.isConnected && (
          <Alert className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Webhook sedang tidak tersedia. Sistem akan menggunakan mode offline dengan respons lokal.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}