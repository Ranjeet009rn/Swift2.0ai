import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PHP_API_URL } from '../config/apiConfig';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const SUGGESTED_QUESTIONS = [
  'What services does Swift2.0AI provide?',
  'When was the company founded?',
  'Where is the company located?',
  'What is the mission of the company?',
];

const AskMeScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-u',
      role: 'user',
      text: content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${PHP_API_URL}company_chat.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      const json = await res.json();

      const replyText = json?.reply || json?.message || 'No reply from assistant.';

      const botMessage: ChatMessage = {
        id: Date.now().toString() + '-b',
        role: 'bot',
        text: replyText,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const botMessage: ChatMessage = {
        id: Date.now().toString() + '-e',
        role: 'bot',
        text: 'Sorry, there was a problem talking to the company assistant. Please try again.',
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Live suggestions from backend (Groq) based on current input
  useEffect(() => {
    const q = input.trim();
    const words = q.split(/\s+/).filter(Boolean);

    // If the input is completely empty, clear suggestions
    if (q.length === 0) {
      setLiveSuggestions([]);
      return;
    }

    // Only START fetching suggestions after at least 2 words are typed.
    // But do NOT clear existing suggestions when words.length < 2.
    if (words.length < 2) {
      return;
    }

    let cancelled = false;

    // Use only the first 3 words as prefix for the API
    const prefix = words.slice(0, 3).join(' ');

    const timeoutId = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await fetch(`${PHP_API_URL}company_suggest.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prefix }),
        });

        const json = await res.json();
        if (!cancelled) {
          const list = Array.isArray(json?.suggestions) ? json.suggestions : [];
          setLiveSuggestions(list);
        }
      } catch (e) {
        if (!cancelled) {
          setLiveSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSuggestLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [input]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="sparkles" size={18} color="#4f46e5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Ask me (Company Assistant)</Text>
            <Text style={styles.headerSubtitle}>
              Ask questions about your company and services, and the assistant will answer using the configured company information.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <ScrollView style={styles.chatArea} contentContainerStyle={{ paddingBottom: 16 }}>
          {messages.map((m) => (
            m.role === 'user' ? (
              <View key={m.id} style={[styles.messageRow, { justifyContent: 'flex-end' }]}>
                <View style={[styles.messageBubble, styles.userBubble]}>
                  <View style={styles.prefixRow}>
                    <Ionicons name="person" size={12} color="#111827" style={{ marginRight: 4 }} />
                    <Text style={styles.messagePrefix}>You:</Text>
                  </View>
                  <Text style={styles.messageText}>{m.text}</Text>
                </View>
                <View style={[styles.avatar, styles.userAvatar]}>
                  <Ionicons name="person" size={14} color="#ffffff" />
                </View>
              </View>
            ) : (
              <View key={m.id} style={[styles.messageRow, { justifyContent: 'flex-start' }]}>
                <View style={[styles.avatar, styles.botAvatar]}>
                  <Ionicons name="logo-android" size={14} color="#4f46e5" />
                </View>
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <View style={styles.prefixRow}>
                    <Ionicons name="logo-android" size={12} color="#111827" style={{ marginRight: 4 }} />
                    <Text style={styles.messagePrefix}>Bot:</Text>
                  </View>
                  <Text style={styles.messageText}>{m.text}</Text>
                </View>
              </View>
            )
          ))}
          {loading && (
            <View style={[styles.messageRow, { justifyContent: 'flex-start' }]}>
              <View style={[styles.avatar, styles.botAvatar]}>
                <Ionicons name="logo-android" size={14} color="#4f46e5" />
              </View>
              <View style={[styles.messageBubble, styles.botBubble]}>
                <ActivityIndicator size="small" color="#4f46e5" />
                <Text style={[styles.messageText, { marginLeft: 8 }]}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type your question..."
              placeholderTextColor="#9ca3af"
              value={input}
              onChangeText={setInput}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendButton, loading && { opacity: 0.6 }]}
              onPress={() => sendMessage()}
              disabled={loading}
            >
              <Ionicons name="send" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {liveSuggestions.length > 0 && (
            <View style={styles.autoSuggestionsContainer}>
              {liveSuggestions.map(s => (
                <TouchableOpacity
                  key={s}
                  style={styles.autoSuggestionRow}
                  onPress={() => setInput(s)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.autoSuggestionHighlight}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#e5ecff',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  suggestionsContainer: {
    marginBottom: 8,
  },
  headerIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 8,
  },
  chatArea: {
    flex: 1,
    marginBottom: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    maxWidth: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#dbeafe',
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: '#eef2ff',
    alignSelf: 'flex-start',
  },
  messagePrefix: {
    fontWeight: '600',
    marginBottom: 2,
    color: '#111827',
  },
  messageText: {
    color: '#111827',
    fontSize: 13,
  },
  prefixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  inputSection: {
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoSuggestionsContainer: {
    marginTop: 6,
  },
  autoSuggestionRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  autoSuggestionHighlight: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  userAvatar: {
    backgroundColor: '#4f46e5',
  },
  botAvatar: {
    backgroundColor: '#e0e7ff',
  },
});

export default AskMeScreen;
