import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Clock, Award, Settings, Sun, Moon, AlertCircle } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  avatar?: string
  userName?: string
}

interface ChatWindowProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isTyping?: boolean
  isOfflineMode?: boolean
}

export function ChatWindow({ messages, onSendMessage, isTyping = false, isOfflineMode = false }: ChatWindowProps) {
  const [input, setInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isComposing) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const quickActions = [
    { label: 'Check attendance hari ini', icon: Clock, action: () => onSendMessage('Bagaimana attendance hari ini?') },
    { label: 'Cek poin reward', icon: Award, action: () => onSendMessage('Berapa poin reward aku sekarang?') },
    { label: 'Shift schedule', icon: Settings, action: () => onSendMessage('Kapan shift kerja minggu ini?') },
  ]

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/yumi-avatar.png" alt="Yumi" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">Yumi HRD</h1>
            <p className="text-sm text-muted-foreground">HR Assistant 🍱</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Badge variant={isOfflineMode ? "destructive" : "secondary"} className="text-xs flex items-center gap-1">
            {isOfflineMode ? (
              <>
                <AlertCircle className="h-3 w-3" />
                Offline Mode
              </>
            ) : (
              'Online'
            )}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Avatar className="h-16 w-16 mx-auto mb-4">
                <AvatarImage src="/yumi-avatar.png" alt="Yumi" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold mb-2">Selamat datang di Yumi HRD! 👋</h3>
              <p className="text-muted-foreground mb-4">
                Saya akan membantu Anda dengan attendance, reward points, dan pertanyaan HR lainnya.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="h-8"
                  >
                    <action.icon className="h-4 w-4 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[80%]`}
              >
                <Avatar className="h-8 w-8">
                  {message.type === 'user' ? (
                    <>
                      <AvatarImage src={message.avatar} alt={message.userName || 'User'} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src="/yumi-avatar.png" alt="Yumi" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                
                <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <Card className={`${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <CardContent className="p-3">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </CardContent>
                  </Card>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/yumi-avatar.png" alt="Yumi" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Ketik pesan Anda..."
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isComposing}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}