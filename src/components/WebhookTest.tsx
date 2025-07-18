import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { WebhookService } from '@/services/webhookService'
import { WebhookStatusIndicator } from '@/components/WebhookStatusIndicator'
import { CheckCircle, XCircle, Loader2, Send } from 'lucide-react'

export function WebhookTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [testMessage, setTestMessage] = useState('')
  const [testName, setTestName] = useState('')
  const [testShift, setTestShift] = useState<'morning' | 'middle' | 'afternoon'>('morning')

  const webhookService = WebhookService.getInstance()

  const testWebhookConnection = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await webhookService.sendMessage('Test connection from Yumi HRD')
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testAttendance = async () => {
    if (!testName.trim()) {
      alert('Please enter a name')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await webhookService.processAttendance(testName, testShift)
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testQuery = async () => {
    if (!testMessage.trim()) {
      alert('Please enter a message')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await webhookService.queryData(testMessage, 'general')
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <WebhookStatusIndicator />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            n8n Webhook Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Webhook URL:</strong></p>
            <p className="font-mono break-all">https://n8n-xkfibcwlmidh.ceri.sumopod.my.id/webhook/15460674-e749-4037-a7aa-c8ddafab944e</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline">GET</Badge>
              <span className="text-xs">Method berubah dari POST ke GET</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={testWebhookConnection} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Enter employee name"
              />
            </div>
            <div>
              <Label htmlFor="shift">Shift</Label>
              <Select value={testShift} onValueChange={(value: any) => setTestShift(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (06:30)</SelectItem>
                  <SelectItem value="middle">Middle (10:00)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (14:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={testAttendance} 
            disabled={isLoading || !testName.trim()}
            className="w-full"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test Attendance
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Query</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter your test message..."
              rows={3}
            />
          </div>
          <Button 
            onClick={testQuery} 
            disabled={isLoading || !testMessage.trim()}
            className="w-full"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Test Query
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Test Result
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? 'Success' : 'Failed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong>Status:</strong> {result.success ? 'Success' : 'Failed'}
              </div>
              <div>
                <strong>Message:</strong> {result.message}
              </div>
              <div>
                <strong>Timestamp:</strong> {result.timestamp}
              </div>
              {result.data && (
                <div>
                  <strong>Data:</strong>
                  <pre className="bg-muted p-2 rounded text-sm mt-1 overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}