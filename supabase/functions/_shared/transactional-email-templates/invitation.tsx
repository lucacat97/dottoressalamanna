/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface InvitationProps {
  inviteUrl?: string
  recipientEmail?: string
  toolsLabel?: string
}

const InvitationEmail = ({ inviteUrl, recipientEmail, toolsLabel }: InvitationProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Sei stato invitato all'Area Riservata della Dott.ssa Lamanna</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Invito all'Area Riservata</Heading>
        <Text style={text}>
          Gentile Dottore/Dottoressa,
        </Text>
        <Text style={text}>
          ti è stato concesso l'accesso all'Area Riservata della <strong>Dott.ssa Annarita Lamanna</strong> con
          una licenza personale per gli strumenti clinici.
        </Text>
        {toolsLabel ? (
          <Section style={box}>
            <Text style={textSmall}><strong>Strumenti abilitati:</strong> {toolsLabel}</Text>
          </Section>
        ) : null}
        <Text style={text}>
          Per attivare l'account imposta la tua password cliccando sul pulsante qui sotto.
          Dovrai poi confermare l'indirizzo email.
        </Text>
        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button href={inviteUrl} style={button}>Attiva il tuo account</Button>
        </Section>
        <Text style={textSmall}>
          Oppure copia e incolla questo link nel browser:<br />
          <span style={{ wordBreak: 'break-all' }}>{inviteUrl}</span>
        </Text>
        <Hr style={hr} />
        <Text style={textSmall}>
          L'invito è stato inviato a <strong>{recipientEmail}</strong> e scade tra 14 giorni.
          Se non hai richiesto questo invito puoi ignorare questa email.
        </Text>
      </Container>
    </Body>
  </Html>
)

const main: React.CSSProperties = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container: React.CSSProperties = { margin: '0 auto', padding: '32px 24px', maxWidth: '560px' }
const h1: React.CSSProperties = { color: '#1a3a3a', fontSize: '22px', fontWeight: 700, margin: '0 0 16px' }
const text: React.CSSProperties = { color: '#333', fontSize: '15px', lineHeight: '24px', margin: '0 0 14px' }
const textSmall: React.CSSProperties = { color: '#666', fontSize: '13px', lineHeight: '20px', margin: '0 0 8px' }
const box: React.CSSProperties = { background: '#f4f7f7', border: '1px solid #d6e0e0', borderRadius: '8px', padding: '12px 16px', margin: '12px 0' }
const button: React.CSSProperties = {
  backgroundColor: '#1a3a3a', color: '#ffffff', padding: '12px 24px',
  borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '15px', display: 'inline-block',
}
const hr: React.CSSProperties = { borderColor: '#e6e6e6', margin: '24px 0 12px' }

export const template: TemplateEntry = {
  component: InvitationEmail,
  subject: 'Invito all\'Area Riservata — Dott.ssa Lamanna',
  displayName: 'Invito Professionista',
  previewData: {
    inviteUrl: 'https://dottoressalamanna.com/auth?invite=demo',
    recipientEmail: 'demo@example.com',
    toolsLabel: 'Supporto Diagnosi, Consulenza Ortodontica',
  },
}
