import React, { useState } from 'react';
import { FaPaperPlane, FaUserCircle } from 'react-icons/fa';

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Manager Alice', content: '大家好，项目正式启动了！', time: '10:00' },
    { id: 2, sender: 'Dev Bob', content: '收到，我已经开始看需求文档了。', time: '10:05' },
    { id: 3, sender: 'Tester Carol', content: '测试用例我稍后整理出来。', time: '10:10' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { 
        id: Date.now(), 
        sender: '我', 
        content: input, 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    }]);
    setInput('');
  };

  return (
    <div className="card" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div className="header" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <h2>项目群聊 (3人)</h2>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f9f9f9' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ 
            display: 'flex', flexDirection: 'column', 
            alignItems: msg.sender === '我' ? 'flex-end' : 'flex-start',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                <FaUserCircle color="#ccc" />
                <span style={{ fontSize: '12px', color: '#666' }}>{msg.sender}</span>
                <span style={{ fontSize: '10px', color: '#999' }}>{msg.time}</span>
            </div>
            <div style={{ 
              background: msg.sender === '我' ? '#1890ff' : 'white', 
              color: msg.sender === '我' ? 'white' : '#333',
              padding: '10px 15px', borderRadius: '8px',
              maxWidth: '70%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ borderTop: '1px solid #eee', padding: '15px', display: 'flex', gap: '10px' }}>
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入消息..."
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <button type="submit" style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FaPaperPlane /> 发送
        </button>
      </form>
    </div>
  );
}
