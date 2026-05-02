/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Conferma il tuo indirizzo email per accedere all'Area Riservata</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Benvenuto/a nell'Area Riservata</Heading>
        <Text style={text}>
          Grazie per esserti registrato/a su{' '}
          <Link href={siteUrl} style={link}>
            <strong>Dott.ssa Annarita Lamanna</strong>
          </Link>
          .
        </Text>
        <Text style={text}>
          Per completare la registrazione, conferma il tuo indirizzo email ({recipient}) cliccando sul pulsante qui sotto:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Conferma il mio indirizzo email
        </Button>
        <Text style={footer}>
          Se non hai creato tu questo account, puoi ignorare questa email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: 'hsl(178, 55%, 18%)', textDecoration: 'underline' }
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
