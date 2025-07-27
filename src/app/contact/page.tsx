"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Clock, MessageSquare, HelpCircle, Building, Users } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  const supportCategories = [
    {
      icon: HelpCircle,
      title: "General Support",
      description: "Questions about using Casa8, account issues, or general inquiries",
    },
    {
      icon: Building,
      title: "Landlord Support",
      description: "Help with listing properties, managing applications, or landlord tools",
    },
    {
      icon: Users,
      title: "Tenant Support",
      description: "Assistance with finding properties, applications, or tenant services",
    },
    {
      icon: MessageSquare,
      title: "Technical Issues",
      description: "Report bugs, technical problems, or website functionality issues",
    },
  ]

  const faqs = [
    {
      question: "How do I list my property on Casa8?",
      answer:
        "Simply create a landlord account, click 'Post Listing' and fill out the property details form. Your listing will be live within 24 hours after verification.",
    },
    {
      question: "Is Casa8 free to use for tenants?",
      answer:
        "Yes! Casa8 is completely free for tenants. You can search properties, contact landlords, and submit applications at no cost.",
    },
    {
      question: "How are properties verified?",
      answer:
        "Our team verifies all property listings by checking ownership documents, photos, and conducting virtual or in-person inspections when necessary.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, debit cards, and bank transfers for premium landlord features and application fees.",
    },
    {
      question: "How quickly do landlords respond to inquiries?",
      answer:
        "Most landlords respond within 24 hours. You can see each landlord's average response time on their profile.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">C8</span>
              </div>
              <span className="text-xl font-bold">Casa8</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-muted-foreground hover:text-primary">
                Home
              </Link>
              <Link href="/search" className="text-muted-foreground hover:text-primary">
                Search
              </Link>
              <Link href="/favorites" className="text-muted-foreground hover:text-primary">
                Favorites
              </Link>
            </nav>
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Get in Touch</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Have questions? We're here to help. Reach out to our friendly support team and we'll get back to you as soon
            as possible.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {/* Email Contact Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Contact Us by Email</CardTitle>
              <CardDescription>
                Send us an email and we'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Email Address</h3>
                <a 
                  href="mailto:info@casa8.com" 
                  className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  info@casa8.com
                </a>
                <p className="text-muted-foreground mt-2">
                  We typically respond within 24 hours during business days
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <Clock className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Response Time</p>
                  <p className="text-muted-foreground">Within 24 hours</p>
                </div>
                <div className="text-center">
                  <MessageSquare className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Support Hours</p>
                  <p className="text-muted-foreground">Mon-Fri 9AM-6PM PST</p>
                </div>
                <div className="text-center">
                  <HelpCircle className="w-5 h-5 mx-auto mb-2 text-primary" />
                  <p className="font-medium">All Inquiries</p>
                  <p className="text-muted-foreground">Welcome</p>
                </div>
              </div>

              <div className="pt-4">
                <a href="mailto:info@casa8.com">
                  <Button size="lg" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="max-w-md mx-auto mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Find answers faster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/help" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help Center
                </Button>
              </Link>
              <Link href="/search" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Building className="w-4 h-4 mr-2" />
                  Browse Properties
                </Button>
              </Link>
              <Link href="/register?role=landlord" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Users className="w-4 h-4 mr-2" />
                  Become a Landlord
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Support Categories */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Can We Help?</h2>
            <p className="text-xl text-muted-foreground">Choose the category that best describes your inquiry</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportCategories.map((category, index) => {
              const IconComponent = category.icon
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                    <a href="mailto:info@casa8.com">
                      <Button variant="outline" size="sm" className="w-full">
                        <Mail className="w-4 h-4 mr-2" />
                        Email Us
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">Quick answers to common questions</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/help">
              <Button variant="outline" size="lg">
                View All FAQs
              </Button>
            </Link>
          </div>
        </section>

        {/* Response Times */}
        <section className="mb-16">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                  What to Expect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">Response Time</h3>
                    <p className="text-muted-foreground">Within 24 hours</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Mail className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">Support Hours</h3>
                    <p className="text-muted-foreground">Mon-Fri 9AM-6PM PST</p>
                  </div>
                </div>
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    For urgent issues, please mark your email as "URGENT" in the subject line
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">C8</span>
                </div>
                <span className="text-xl font-bold">Casa8</span>
              </div>
              <p className="text-muted-foreground">Your trusted partner in finding the perfect rental property.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Tenants</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/search" className="hover:text-primary">
                    Search Properties
                  </Link>
                </li>
                <li>
                  <Link href="/saved" className="hover:text-primary">
                    Saved Properties
                  </Link>
                </li>
                <li>
                  <Link href="/applications" className="hover:text-primary">
                    My Applications
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Landlords</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/list-property" className="hover:text-primary">
                    List Property
                  </Link>
                </li>
                <li>
                  <Link href="/applications" className="hover:text-primary">
                    Applications
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/help" className="hover:text-primary">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Casa8. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
