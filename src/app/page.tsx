import AuthButton from '@/components/AuthButton'
import EmailList from '@/components/EmailList'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <AuthButton />
        <EmailList />
      </div>
    </main>
  )
}
