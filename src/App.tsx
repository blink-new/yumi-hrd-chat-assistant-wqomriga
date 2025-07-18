import { useState, useEffect } from 'react'
import { ChatWindow } from './components/chat/ChatWindow'
import { WebhookTest } from './components/WebhookTest'
import { ThemeProvider } from './components/theme-provider'
import { SystemNotice } from './components/SystemNotice'
import { ChatService } from './services/chatService'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  avatar?: string
  userName?: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const chatService = ChatService.getInstance()

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'ai',
      content: 'Selamat datang di Yumi HRD! 👋\n\nSaya akan membantu Anda dengan attendance, reward points, dan pertanyaan HR lainnya.\n\nApa yang bisa saya bantu hari ini?',
      timestamp: new Date(),
      userName: 'Yumi'
    }
    setMessages([welcomeMessage])
  }, [])

  const handleSendMessage = async (content: string) => {
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      userName: 'Anda'
    }
    setMessages(prev => [...prev, userMessage])

    // Show typing indicator
    setIsTyping(true)

    try {
      // Get AI response
      const aiMessage = await chatService.sendMessage(content)
      setMessages(prev => [...prev, aiMessage])
      
      // Check if response indicates offline mode
      const isOffline = aiMessage.content.includes('Mode Offline') || aiMessage.content.includes('mode offline') || aiMessage.content.includes('beralih ke mode offline')
      setIsOfflineMode(isOffline)
      
      // Show informative toast for offline mode - only show once when transitioning to offline
      if (isOffline && !isOfflineMode) {
        toast.info('Mode Offline Aktif', {
          description: 'Sistem beralih ke mode offline - respons lokal akan digunakan untuk memastikan pengalaman tetap lancar',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      let errorContent = 'Maaf, terjadi kesalahan. Silakan coba lagi dalam beberapa saat.'
      let toastTitle = 'Error'
      let toastDescription = 'Terjadi kesalahan saat mengirim pesan'
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorContent = 'Koneksi timeout. Silakan coba lagi.'
          toastTitle = 'Koneksi Timeout'
          toastDescription = 'Server tidak merespons dalam waktu yang wajar'
        } else if (error.message.includes('Network')) {
          errorContent = 'Masalah jaringan. Periksa koneksi internet Anda.'
          toastTitle = 'Masalah Jaringan'
          toastDescription = 'Periksa koneksi internet Anda'
        }
      }
      
      // Show error toast
      toast.error(toastTitle, {
        description: toastDescription,
        duration: 4000
      })
      
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: errorContent,
        timestamp: new Date(),
        userName: 'Yumi'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="yumi-hrd-theme">
      <div className="min-h-screen bg-background font-sans antialiased">
        <Tabs defaultValue="chat" className="h-screen flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="webhook">Webhook Test</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1">
            <ChatWindow 
              messages={messages}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
              isOfflineMode={isOfflineMode}
            />
          </TabsContent>
          <TabsContent value="webhook" className="flex-1">
            <WebhookTest />
          </TabsContent>
        </Tabs>
        <Toaster />
        {isOfflineMode && <SystemNotice />}
      </div>
    </ThemeProvider>
  )
}

export default App