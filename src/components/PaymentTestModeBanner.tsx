const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) return null;
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-xs sm:text-sm text-orange-900 font-body">
        Modalità test: nessun pagamento reale verrà addebitato. Usa la carta 4242 4242 4242 4242 per testare.
      </div>
    );
  }
  return null;
}
