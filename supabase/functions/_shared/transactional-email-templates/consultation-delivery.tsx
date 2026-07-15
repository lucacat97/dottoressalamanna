import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Studio Carella & Lamanna'

interface ConsultationDeliveryProps {
  professionalFirstName?: string
  professionalLastName?: string
  consultationType?: string
  introHtml?: string
  downloadUrl?: string
  format?: 'word' | 'pdf'
}

const ConsultationDeliveryEmail = ({
  professionalFirstName,
  professionalLastName,
  consultationType,
  introHtml,
  downloadUrl,
  format,
}: ConsultationDeliveryProps) => {

  const greeting = professionalFirstName || professionalLastName
    ? `Gentile Dott./Dott.ssa ${[professionalFirstName, professionalLastName].filter(Boolean).join(' ')}`
    : 'Gentile Dottore/Dottoressa'
  const title = consultationType || 'Consulenza sul caso'
  const isPdf = format === 'pdf'
  const formatLabel = isPdf ? 'PDF' : 'Word'
  const openWithNote = isPdf
    ? 'Apra il file con qualunque lettore PDF.'
    : 'Apra il file con Microsoft Word, Pages o Google Docs.'

  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>{title} — Metodo MILA</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          <Text style={text}>{greeting},</Text>
          <Text style={text}>
            di seguito trova una breve <strong>introduzione</strong> alla {title.toLowerCase()} elaborata
            secondo il Metodo MILA. La consulenza completa è disponibile nel
            <strong> documento {formatLabel} allegato</strong> scaricabile dal pulsante in fondo alla mail.
          </Text>

          {introHtml ? (
            <Section style={consultationBox}>
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: introHtml }}
              />
            </Section>
          ) : null}

          {downloadUrl ? (
            <Section style={{ textAlign: 'center', margin: '28px 0' }}>
              <Button href={downloadUrl} style={button}>
                Scarica la consulenza completa ({formatLabel})
              </Button>
              <Text style={smallNote}>
                Per motivi di sicurezza, il link è personale, valido <strong>5 giorni</strong> e consente al massimo <strong>5 download</strong>. {openWithNote}
              </Text>
            </Section>

          ) : (
            <Text style={text}>
              <em>Non è stato possibile generare il link di download. Risponda a questa email per ricevere il documento.</em>
            </Text>
          )}

          <Text style={disclaimerText}>
            La consulenza è uno strumento di supporto al ragionamento clinico e
            <strong> non costituisce in alcun modo una diagnosi medica</strong>: la responsabilità
            diagnostica e terapeutica resta interamente in capo al professionista sanitario.
          </Text>
          <Text style={footer}>Cordiali saluti,<br />{SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ConsultationDeliveryEmail,
  subject: (data: Record<string, any>) => {
    const t = (data?.consultationType as string) || 'Consulenza sul caso'
    return `${t} — Metodo MILA`
  },
  displayName: 'Consegna consulenza al professionista',
  previewData: {
    professionalFirstName: 'Mario',
    professionalLastName: 'Rossi',
    consultationType: 'Consulenza Clinica',
    introHtml: '<p>Il quadro clinico raccolto evidenzia alcuni elementi orientativi che vengono approfonditi nel documento allegato.</p>',
    downloadUrl: 'https://example.com/download',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '720px' }
const h1 = {
  fontSize: '22px', fontWeight: 'bold', color: '#2a6f6f',
  margin: '0 0 20px', fontFamily: 'Georgia, serif',
}
const text = { fontSize: '14px', color: '#222222', lineHeight: '1.6', margin: '0 0 16px' }
const consultationBox = {
  margin: '20px 0',
  padding: '18px 20px',
  backgroundColor: '#f7faf9',
  border: '1px solid #d9e6e4',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#222222',
  lineHeight: '1.6',
}
const button = {
  backgroundColor: '#2a6f6f',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 'bold',
  display: 'inline-block',
}
const smallNote = { fontSize: '12px', color: '#666666', margin: '10px 0 0' }
const disclaimerText = {
  fontSize: '12px', color: '#5b4708', backgroundColor: '#fff8e1',
  padding: '10px 14px', borderRadius: '6px', margin: '20px 0 0', lineHeight: '1.5',
}
const footer = { fontSize: '12px', color: '#666666', margin: '24px 0 0' }
