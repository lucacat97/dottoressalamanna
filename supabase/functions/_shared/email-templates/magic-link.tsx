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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Il tuo link di accesso all'Area Riservata</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Il tuo link di accesso</Heading>
        <Text style={text}>
          Clicca sul pulsante qui sotto per accedere all'Area Riservata della Dott.ssa Annarita Lamanna. Il link scadrà a breve.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accedi ora
        </Button>
        <Text style={footer}>
          Se non hai richiesto questo link, puoi ignorare questa email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
