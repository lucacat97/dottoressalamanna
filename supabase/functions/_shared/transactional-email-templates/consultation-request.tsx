import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Attachment { name: string; url: string }
interface Props {
  requesterName?: string
  requesterEmail?: string
  requesterPhone?: string
  message?: string
  sourcePage?: string
  channel?: string
  attachments?: Attachment[]
}

const ConsultationRequestEmail = ({
  requesterName,
  requesterEmail,
  requesterPhone,
  message,
  sourcePage,
  channel,
  attachments,
}: Props) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Nuova richiesta di consulenza personalizzata</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nuova richiesta di consulenza</Heading>
        <Text style={text}>
          È arrivata una nuova richiesta di consulenza personalizzata dal sito.
        </Text>
        <Section style={box}>
          {channel ? (
            <Text style={row}><strong>Canale:</strong> {channel}</Text>
          ) : null}
          <Text style={row}><strong>Nome:</strong> {requesterName || '—'}</Text>
          <Text style={row}><strong>Email:</strong> {requesterEmail || '—'}</Text>
          <Text style={row}><strong>Telefono:</strong> {requesterPhone || '—'}</Text>
          {sourcePage ? (
            <Text style={row}><strong>Pagina:</strong> {sourcePage}</Text>
          ) : null}
          <Hr style={hr} />
          <Text style={row}><strong>Messaggio:</strong></Text>
          <Text style={messageStyle}>{message || '—'}</Text>
          {attachments && attachments.length > 0 ? (
            <>
              <Hr style={hr} />
              <Text style={row}><strong>Allegati ({attachments.length}):</strong></Text>
              {attachments.map((a, i) => (
                <Text key={i} style={row}>
                  📎 <Link href={a.url} style={linkStyle}>{a.name}</Link>
                </Text>
              ))}
              <Text style={{ ...row, fontSize: '11px', color: '#666' }}>
                I link sono validi per 30 giorni.
              </Text>
            </>
          ) : null}
        </Section>
        <Text style={footer}>
          Per rispondere, scrivere direttamente a {requesterEmail || 'l\'indirizzo del richiedente'}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ConsultationRequestEmail,
  subject: (data: Record<string, any>) => {
    const n = (data?.requesterName as string) || 'anonimo'
    return `Richiesta consulenza — ${n}`
  },
  displayName: 'Richiesta consulenza personalizzata',
  previewData: {
    requesterName: 'Mario Rossi',
    requesterEmail: 'mario@example.com',
    requesterPhone: '+39 333 000 0000',
    message: 'Vorrei una consulenza per mio figlio di 9 anni.',
    sourcePage: 'https://dottoressalamanna.com/',
    channel: 'Diretto — Scrivi alla Dott.ssa',
    attachments: [{ name: 'radiografia.jpg', url: 'https://example.com/x.jpg' }],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '720px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#2a6f6f', margin: '0 0 16px', fontFamily: 'Georgia, serif' }
const text = { fontSize: '14px', color: '#222', lineHeight: '1.6', margin: '0 0 16px' }
const box = { margin: '16px 0', padding: '18px 20px', backgroundColor: '#f7faf9', border: '1px solid #d9e6e4', borderRadius: '8px' }
const row = { fontSize: '14px', color: '#222', margin: '4px 0', lineHeight: '1.5' }
const messageStyle = { fontSize: '14px', color: '#222', margin: '4px 0 0', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#d9e6e4', margin: '12px 0' }
const footer = { fontSize: '12px', color: '#666', margin: '20px 0 0' }
const linkStyle = { color: '#2a6f6f', textDecoration: 'underline' }
