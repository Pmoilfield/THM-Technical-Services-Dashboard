import './globals.css'

export const metadata = {
  title: 'THM Technical Services',
  description: 'Field Service Management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
