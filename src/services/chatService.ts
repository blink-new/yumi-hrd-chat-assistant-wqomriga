// Chat service with n8n webhook integration
import { WebhookService } from './webhookService'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  avatar?: string
  userName?: string
}

export class ChatService {
  private static instance: ChatService
  private messages: ChatMessage[] = []
  private webhookService: WebhookService

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService()
    }
    return ChatService.instance
  }

  constructor() {
    this.webhookService = WebhookService.getInstance()
  }

  async sendMessage(content: string): Promise<ChatMessage> {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      userName: 'Anda'
    }

    this.messages.push(userMessage)

    try {
      // Send to n8n webhook for processing
      const webhookResponse = await this.webhookService.sendMessage(content)
      
      let aiResponse: string
      if (webhookResponse.success && webhookResponse.data?.response) {
        // Use response from n8n/AI
        aiResponse = webhookResponse.data.response
      } else {
        // Fallback to local response generation
        aiResponse = this.generateAIResponse(content)
        
        // Add info about webhook status if failed
        if (!webhookResponse.success) {
          console.log('Webhook failed, using fallback response:', webhookResponse.message)
          
          // Add more user-friendly error context based on specific error types
          if (webhookResponse.message.includes('Server bermasalah') || webhookResponse.message.includes('n8n workflow') || webhookResponse.message.includes('error internal')) {
            aiResponse += '\n\n⚠️ **Mode Offline**: Server AI sedang bermasalah, menggunakan respons lokal untuk membantu Anda.'
          } else if (webhookResponse.message.includes('tidak dapat terhubung') || webhookResponse.message.includes('Failed to fetch')) {
            aiResponse += '\n\n⚠️ **Mode Offline**: Koneksi ke server terputus, menggunakan mode offline sementara.'
          } else if (webhookResponse.message.includes('timeout') || webhookResponse.message.includes('tidak merespons')) {
            aiResponse += '\n\n⚠️ **Mode Offline**: Server lambat merespons, menggunakan mode offline untuk respons lebih cepat.'
          } else if (webhookResponse.message.includes('maintenance')) {
            aiResponse += '\n\n⚠️ **Mode Offline**: Server sedang maintenance, menggunakan mode offline sementara.'
          } else if (webhookResponse.message.includes('beralih ke mode offline')) {
            aiResponse += '\n\n⚠️ **Mode Offline**: Sistem beralih ke mode offline untuk memastikan pengalaman tetap lancar.'
          } else {
            aiResponse += '\n\n⚠️ **Mode Offline**: Sistem sedang dalam mode offline, beberapa fitur mungkin terbatas.'
          }
        } else {
          console.log('Webhook succeeded but no AI response, using local fallback')
        }
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
        userName: 'Yumi'
      }

      this.messages.push(aiMessage)
      return aiMessage
    } catch (error) {
      console.error('Error in chat service:', error)
      
      // Fallback to local response
      const aiResponse = this.generateAIResponse(content)
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse + '\n\n⚠️ Catatan: Menggunakan mode offline sementara karena masalah koneksi.',
        timestamp: new Date(),
        userName: 'Yumi'
      }

      this.messages.push(aiMessage)
      return aiMessage
    }
  }

  private generateAIResponse(userMessage: string): string {
    const message = userMessage.toLowerCase()

    // Pattern matching for different HR-related queries
    if (message.includes('attendance') || message.includes('absen') || message.includes('kehadiran')) {
      return `📊 Attendance hari ini:\n\nShift Pagi (06:30): 15 karyawan hadir\nShift Siang (10:00): 12 karyawan hadir\nShift Sore (14:00): 10 karyawan hadir\n\nTotal: 37 karyawan hadir ✅\n\nApakah ada yang ingin Anda ketahui lebih lanjut?`
    }

    if (message.includes('poin') || message.includes('reward') || message.includes('point')) {
      return `🎉 Poin reward Anda:\n\n✨ Total poin: 48 poin\n📅 Poin minggu ini: 12 poin\n🏆 Rank: Top 5 karyawan\n\nPoin bisa ditukar dengan:\n• Voucher makan (20 poin)\n• Cuti tambahan (50 poin)\n• Merchandise (30 poin)\n\nSelamat! Anda hampir mencapai target bulanan! 🚀`
    }

    if (message.includes('shift') || message.includes('jadwal') || message.includes('schedule')) {
      return `📅 Jadwal shift minggu ini:\n\nSenin-Rabu: Shift Pagi (06:30-14:30)\nKamis-Jumat: Shift Siang (10:00-18:00)\nSabtu: Shift Sore (14:00-22:00)\nMinggu: Libur\n\nJangan lupa check-in tepat waktu untuk mendapatkan poin reward! ⏰`
    }

    if (message.includes('terlambat') || message.includes('late') || message.includes('telat')) {
      return `⚠️ Informasi keterlambatan:\n\nGrace period: 15 menit setelah shift dimulai\nSetelah 15 menit: -1 poin reward\nSetelah 30 menit: Peringatan tertulis\n\nTips: Gunakan fingerprint scanner 5 menit sebelum shift dimulai untuk bonus +1 poin! 💡`
    }

    if (message.includes('cuti') || message.includes('izin') || message.includes('leave')) {
      return `🏖️ Pengajuan cuti:\n\nSisa cuti tahunan: 8 hari\nCuti sakit: 2 hari terpakai\nCuti darurat: 1 hari tersisa\n\nUntuk mengajukan cuti, silakan hubungi HR dengan form yang telah disediakan atau gunakan sistem online.\n\nPerlu bantuan lainnya? 😊`
    }

    // Default friendly response
    const responses = [
      `Halo! Saya Yumi, asisten HR Anda 🤖\n\nSaya dapat membantu dengan:\n• Cek attendance dan kehadiran\n• Informasi poin reward\n• Jadwal shift kerja\n• Pengajuan cuti\n• Pertanyaan HR lainnya\n\nAda yang bisa saya bantu hari ini?`,
      `Terima kasih sudah bertanya! 😊\n\nSaya siap membantu Anda dengan semua kebutuhan HR. Silakan tanya tentang attendance, reward points, atau informasi lainnya.`,
      `Saya di sini untuk membantu! 🍱\n\nCoba tanyakan tentang:\n• "Berapa poin reward aku?"\n• "Bagaimana attendance hari ini?"\n• "Kapan shift kerja minggu ini?"\n\nApa yang ingin Anda ketahui?`
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Process attendance via webhook
  async processAttendance(nama: string, shift: 'morning' | 'middle' | 'afternoon'): Promise<ChatMessage> {
    try {
      const response = await this.webhookService.processAttendance(nama, shift)
      
      let content: string
      if (response.success) {
        content = `✅ Attendance berhasil dicatat!\n\nNama: ${nama}\nShift: ${shift}\nWaktu: ${new Date().toLocaleTimeString('id-ID')}\n\n${response.data?.message || 'Terima kasih sudah check-in tepat waktu!'}`
      } else {
        content = `❌ Gagal mencatat attendance: ${response.message}\n\nSilakan coba lagi atau hubungi admin HR.`
      }

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content,
        timestamp: new Date(),
        userName: 'Yumi'
      }

      this.messages.push(aiMessage)
      return aiMessage
    } catch (error) {
      console.error('Error processing attendance:', error)
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Error sistem: ${error instanceof Error ? error.message : 'Unknown error'}\n\nSilakan coba lagi nanti.`,
        timestamp: new Date(),
        userName: 'Yumi'
      }

      this.messages.push(aiMessage)
      return aiMessage
    }
  }

  // Query specific data via webhook
  async querySpecificData(query: string, type: 'attendance' | 'rewards' | 'general' = 'general'): Promise<ChatMessage> {
    try {
      const response = await this.webhookService.queryData(query, type)
      
      let content: string
      if (response.success && response.data?.response) {
        content = response.data.response
      } else {
        content = this.generateAIResponse(query)
        if (!response.success) {
          content += '\n\n⚠️ Catatan: Menggunakan data offline sementara.'
        }
      }

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content,
        timestamp: new Date(),
        userName: 'Yumi'
      }

      this.messages.push(aiMessage)
      return aiMessage
    } catch (error) {
      console.error('Error querying data:', error)
      
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Error sistem: ${error instanceof Error ? error.message : 'Unknown error'}\n\nSilakan coba lagi nanti.`,
        timestamp: new Date(),
        userName: 'Yumi'
      }

      this.messages.push(aiMessage)
      return aiMessage
    }
  }

  getMessages(): ChatMessage[] {
    return this.messages
  }

  clearMessages(): void {
    this.messages = []
  }
}