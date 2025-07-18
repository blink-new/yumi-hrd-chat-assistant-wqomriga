import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Info, X, ExternalLink, RefreshCw } from 'lucide-react'

export function SystemNotice() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertTitle className="text-orange-800 dark:text-orange-200">
          Mode Offline Aktif
        </AlertTitle>
        <AlertDescription className="text-orange-700 dark:text-orange-300">
          <p className="mb-2">
            n8n webhook server sedang mengalami masalah (Error 500). 
            Sistem beralih ke mode offline untuk memastikan pengalaman tetap lancar.
          </p>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="text-orange-800 dark:text-orange-200">
              <Info className="h-3 w-3 mr-1" />
              Fitur offline masih berfungsi penuh
            </Badge>
          </div>
        </AlertDescription>
        <div className="mt-3 flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()} 
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(false)}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Alert>
    </div>
  )
}

export function DevNotice() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Info untuk Developer
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-xs text-blue-700 dark:text-blue-300">
            <p className="mb-2">
              <strong>n8n Webhook Issue:</strong> Server returns 500 error
            </p>
            <p className="mb-2">
              <strong>URL:</strong> 
              <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">
                https://n8n-xkfibcwlmidh.ceri...
              </code>
            </p>
            <p className="mb-2">
              <strong>Solution:</strong> Check n8n workflow configuration
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('https://n8n-xkfibcwlmidh.ceri.sumopod.my.id', '_blank')}
                className="h-6 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                n8n Dashboard
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}