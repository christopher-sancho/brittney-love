import { useState, useEffect, useRef } from 'react'
import './App.css'
import { saveMessage, getAllMessages, saveMessageWithImage } from './vercelService'

// Helper function to compress images
const compressImage = (file, quality = 0.6) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions (max 800px width/height)
      const maxSize = 800
      let { width, height } = img
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedBase64)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

function App() {
  const [step, setStep] = useState('welcome') // welcome, name-check, collect-message, ask-another, ask-picture, view-messages
  const [userName, setUserName] = useState('')
  const [currentMessage, setCurrentMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Load messages from Vercel on component mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const vercelMessages = await getAllMessages()
        setMessages(vercelMessages)
      } catch (error) {
        console.error('Failed to load messages from Vercel:', error)
        // Fallback to localStorage if Vercel fails
        const savedMessages = localStorage.getItem('brittney-birthday-messages')
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages))
        }
      }
    }
    
    loadMessages()
  }, [])

  // Auto-scroll to bottom when new chat messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Add a chat message with typing animation
  const addChatMessage = (text, isUser = false, delay = 1000) => {
    setTimeout(() => {
      setChatMessages(prev => [...prev, { text, isUser, timestamp: Date.now() }])
    }, delay)
  }

  // Initialize welcome flow
  useEffect(() => {
    if (step === 'welcome') {
      setChatMessages([])
      addChatMessage("Hey there! 👋", false, 500)
      addChatMessage("I'm here to help collect some special birthday messages for Brittney! 🎉💕", false, 1500)
      addChatMessage("First, let me ask - are you Savanna Brittney Sancho (nee Ramkissoon)?", false, 3000)
    }
  }, [step])

  const handleNameResponse = (isBrittney) => {
    if (isBrittney) {
      addChatMessage("Yes, that's me! 💕", true, 0)
      addChatMessage("Hi Brittney! 🥳✨", false, 1000)
      addChatMessage("Happy Birthday, beautiful! 🎂💕", false, 2000)
      addChatMessage("Here are some wonderful messages from your favorite people:", false, 3500)
      setTimeout(() => setStep('view-messages'), 4500)
    } else {
      addChatMessage("No, that's not me", true, 0)
      addChatMessage("Perfect! What's your name? 😊", false, 1000)
      setTimeout(() => setStep('name-check'), 2000)
    }
  }

  const handleNameSubmit = (e) => {
    e.preventDefault()
    if (userName.trim()) {
      addChatMessage(userName, true, 0)
      addChatMessage(`Nice to meet you, ${userName}! 😊`, false, 1000)
      addChatMessage("Would you like to leave a fun/loving message or share your favorite memory of Brittney?", false, 2500)
      setTimeout(() => setStep('collect-message'), 3500)
    }
  }

  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    if (currentMessage.trim()) {
      const newMessage = {
        name: userName,
        message: currentMessage,
        timestamp: new Date().toISOString()
      }
      
      try {
        // Save to Vercel
        const result = await saveMessage(newMessage)
        
        // Add to local state for immediate UI update
        const savedMessage = result.message
        const updatedMessages = [...messages, savedMessage]
        setMessages(updatedMessages)
        
        // Keep localStorage as backup
        localStorage.setItem('brittney-birthday-messages', JSON.stringify(updatedMessages))
        
        addChatMessage(currentMessage, true, 0)
        addChatMessage("Thank you so much! ❤️ Your message has been saved for Brittney's birthday! 🎉", false, 1000)
        addChatMessage("Would you like to share another memory or message? 😊", false, 2500)
        
        // Reset form
        setCurrentMessage('')
        setSelectedImage(null)
        setTimeout(() => setStep('ask-another'), 3500)
        
      } catch (error) {
        console.error('Failed to save message:', error)
        addChatMessage(currentMessage, true, 0)
        addChatMessage("Oops! There was an issue saving your message. But don't worry, it's saved locally! 💕", false, 1000)
        
        // Fallback to localStorage only
        const messageWithId = { ...newMessage, id: Date.now() }
        const updatedMessages = [...messages, messageWithId]
        setMessages(updatedMessages)
        localStorage.setItem('brittney-birthday-messages', JSON.stringify(updatedMessages))
        
        setTimeout(() => setStep('ask-another'), 2500)
      }
    }
  }

  const handleAnotherMemory = (wantsAnother) => {
    if (wantsAnother) {
      // Clear chat messages and go directly to message input to avoid confusion
      setChatMessages([])
      addChatMessage("What else would you like to share about Brittney? 🥰", false, 500)
      setTimeout(() => setStep('collect-message'), 1000)
    } else {
      addChatMessage("No, that's all for now 😊", true, 0)
      addChatMessage("Perfect! Would you like to share a favorite picture of Brittney? 📸✨", false, 1000)
      setTimeout(() => setStep('ask-picture'), 2500)
    }
  }

  const handlePictureResponse = (wantsPicture) => {
    if (wantsPicture) {
      addChatMessage("Yes, I'd love to share a picture! 📸", true, 0)
      addChatMessage("Amazing! Please select your favorite picture of Brittney below 💕", false, 1000)
      setTimeout(() => {
        // Better mobile file input triggering
        if (fileInputRef.current) {
          fileInputRef.current.value = '' // Reset input
          fileInputRef.current.click()
        }
      }, 2000)
    } else {
      addChatMessage("No pictures this time 😊", true, 0)
      addChatMessage("That's perfectly fine! Thank you so much for your beautiful message! 🎉💕", false, 1000)
      addChatMessage("Brittney is going to be so happy! 🥰", false, 2500)
      setTimeout(() => {
        setStep('welcome')
        setUserName('')
      }, 4000)
    }
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        addChatMessage("Uploading your beautiful picture... 📸✨", false, 500)
        
        // Convert file to base64 and compress if needed
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            let base64Data = event.target.result
            
            // Compress image if it's too large (over 2MB base64 = ~1.5MB actual)
            if (base64Data.length > 2000000) {
              base64Data = await compressImage(file, 0.6) // Compress to 60% quality
            }
            
            // Save the image with a message to Vercel
            const imageMessage = {
              name: userName,
              message: "Shared a favorite picture! 📸💕",
              timestamp: new Date().toISOString()
            }
            
            await saveMessageWithImage(imageMessage, base64Data)
            
            // Refresh messages from Vercel to get the new image
            const updatedMessages = await getAllMessages()
            setMessages(updatedMessages)
            
            addChatMessage("Perfect! Your picture has been added! 📸✨", false, 2000)
            addChatMessage("Thank you for sharing such a beautiful memory! 💕", false, 3500)
            addChatMessage("Brittney is going to love this! 🥰", false, 5000)
            
            setTimeout(() => {
              setStep('welcome')
              setUserName('')
            }, 6500)
            
          } catch (error) {
            console.error('Failed to upload image to Vercel:', error)
            
            // Fallback to local storage with base64
            const imageMessage = {
              id: Date.now(),
              name: userName,
              message: "Shared a favorite picture! 📸💕",
              image: base64Data, // This variable is available in this scope
              timestamp: new Date().toISOString()
            }
            
            const updatedMessages = [...messages, imageMessage]
            setMessages(updatedMessages)
            localStorage.setItem('brittney-birthday-messages', JSON.stringify(updatedMessages))
            
            addChatMessage("Picture saved locally! 📸 (Note: Upload to server failed)", false, 1000)
            addChatMessage("Thank you for sharing! 💕", false, 2500)
            
            setTimeout(() => {
              setStep('welcome')
              setUserName('')
            }, 4000)
          }
        }
        reader.readAsDataURL(file)
        
      } catch (error) {
        console.error('Failed to process image:', error)
        addChatMessage("Sorry, there was an issue with the image. Please try again! 😊", false, 1000)
      }
    }
  }

  return (
    <div className="app">
      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span className="time">
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
        <div className="status-center">
          <div className="notch"></div>
        </div>
        <div className="status-right">
          <div className="battery">
            <div className="battery-level"></div>
          </div>
          <span className="signal">📶</span>
        </div>
      </div>

      {/* Header */}
      <div className="header">
        <div className="contact-info">
          <div className="avatar">
            💕
          </div>
          <div className="contact-details">
            <div className="contact-name">Birthday Messages</div>
            <div className="contact-status">for Brittney ✨</div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {step === 'view-messages' ? (
          <div className="birthday-messages">
            <div className="birthday-header">
              <h2>💕 Happy Birthday Brittney! 🎂</h2>
              <p>Messages from people who love you:</p>
            </div>
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet! Share the link with friends and family! 💕</p>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((msg) => (
                  <div key={msg.id} className="birthday-message">
                    <div className="message-author">From: {msg.name} 💕</div>
                    <div className="message-content">{msg.message}</div>
                    {msg.image && (
                      <div className="message-image">
                        <img src={msg.image} alt="Shared memory" />
                      </div>
                    )}
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button 
              className="back-button"
              onClick={() => setStep('welcome')}
            >
              ← Back to start
            </button>
          </div>
        ) : (
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`message ${msg.isUser ? 'user' : 'bot'}`}>
                <div className="message-bubble">
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*,image/heic,image/heif"
        style={{ display: 'none' }}
      />

      {/* Input Area */}
      {step !== 'view-messages' && (
        <div className="input-container">
          {step === 'welcome' && (
            <div className="response-buttons">
              <button 
                className="response-btn yes"
                onClick={() => handleNameResponse(true)}
              >
                Yes, that's me! 💕
              </button>
              <button 
                className="response-btn no"
                onClick={() => handleNameResponse(false)}
              >
                No, that's not me
              </button>
            </div>
          )}

          {step === 'name-check' && (
            <form onSubmit={handleNameSubmit} className="input-form">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name..."
                  className="text-input"
                  autoFocus
                />
                <button type="submit" className="send-btn">
                  ➤
                </button>
              </div>
            </form>
          )}

          {step === 'collect-message' && (
            <form onSubmit={handleMessageSubmit} className="input-form">
              <div className="input-wrapper">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Share your message or favorite memory..."
                  className="text-input message-input"
                  rows="3"
                  autoFocus
                />
                <button type="submit" className="send-btn">
                  ➤
                </button>
              </div>
            </form>
          )}

          {step === 'ask-another' && (
            <div className="response-buttons">
              <button 
                className="response-btn yes"
                onClick={() => handleAnotherMemory(true)}
              >
                📝 Add Another Message
              </button>
              <button 
                className="response-btn no"
                onClick={() => handleAnotherMemory(false)}
              >
                📸 Share a Picture Instead
              </button>
            </div>
          )}

          {step === 'ask-picture' && (
            <div className="response-buttons">
              <button 
                className="response-btn yes"
                onClick={() => handlePictureResponse(true)}
              >
                Yes, I'd love to share a picture! 📸
              </button>
              <button 
                className="response-btn no"
                onClick={() => handlePictureResponse(false)}
              >
                No pictures this time 😊
              </button>
              {/* Fallback direct file input for mobile */}
              <label htmlFor="mobile-file-input" className="mobile-file-label">
                📷 Choose from Photos/Camera
              </label>
              <input
                id="mobile-file-input"
                type="file"
                onChange={handleImageSelect}
                accept="image/*,image/heic,image/heif"
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
