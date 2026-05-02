/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Reimposta la password della tua Area Riservata</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reimposta la tua password</Heading>
        <Text style={text}>
          Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account sull'Area Riservata della Dott.ssa Annarita Lamanna. Clicca sul pulsante qui sotto per scegliere una nuova password.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reimposta la password
        </Button>
        <Text style={footer}>
          Se non hai richiesto la reimpostazione, ignora questa email. La tua password rimarrà invariata.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Raleway', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '26px',
  fontWeight: '600' as const,
  color: 'hsl(178, 55%, 18%)',
  margin: '0 0 24px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(180, 12%, 28%)',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: 'hsl(178, 55%, 18%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '500' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0 24px',
}
const footer = { fontSize: '12px', color: 'hsl(180, 12%, 50%)', margin: '32px 0 0', lineHeight: '1.5' }
