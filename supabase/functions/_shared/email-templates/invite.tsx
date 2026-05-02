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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Sei stato/a invitato/a all'Area Riservata</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Hai ricevuto un invito</Heading>
        <Text style={text}>
          Sei stato/a invitato/a a unirti all'Area Riservata della Dott.ssa Annarita Lamanna. Clicca sul pulsante qui sotto per accettare l'invito e creare il tuo account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accetta l'invito
        </Button>
        <Text style={footer}>
          Se non aspettavi questo invito, puoi ignorare questa email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
