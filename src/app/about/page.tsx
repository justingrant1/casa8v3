import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Home, Shield, Award, CheckCircle, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AboutPage() {
  const stats = [
    { label: "Properties Listed", value: "10,000+", icon: Home },
    { label: "Happy Tenants", value: "25,000+", icon: Users },
    { label: "Trusted Landlords", value: "5,000+", icon: Shield },
    { label: "Years of Experience", value: "8+", icon: Award },
  ]

  const features = [
    {
      title: "Easy Property Search",
      description: "Find your perfect home with our advanced search filters and interactive map.",
      icon: "🔍",
    },
    {
      title: "Verified Listings",
      description: "All properties are verified by our team to ensure accuracy and authenticity.",
      icon: "✅",
    },
    {
      title: "Instant Communication",
      description: "Connect with landlords instantly through our built-in messaging system.",
      icon: "💬",
    },
    {
      title: "Secure Applications",
      description: "Submit rental applications securely with our encrypted platform.",
      icon: "🔒",
    },
    {
      title: "Property Management",
      description: "Landlords can easily manage their properties, applications, and tenants.",
      icon: "🏢",
    },
    {
      title: "24/7 Support",
      description: "Our dedicated support team is available around the clock to help you.",
      icon: "🎧",
    },
  ]

  const teamMembers = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      image: "/placeholder.svg?height=200&width=200",
      bio: "Former real estate agent with 15+ years of experience in the industry.",
    },
    {
      name: "Michael Chen",
      role: "CTO",
      image: "/placeholder.svg?height=200&width=200",
      bio: "Tech entrepreneur passionate about solving real estate challenges through innovation.",
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Operations",
      image: "/placeholder.svg?height=200&width=200",
      bio: "Operations expert ensuring smooth experiences for all Casa8 users.",
    },
    {
      name: "David Kim",
      role: "Head of Customer Success",
      image: "/placeholder.svg?height=200&width=200",
      bio: "Dedicated to helping landlords and tenants achieve their rental goals.",
    },
  ]

  const testimonials = [
    {
      name: "Jennifer Martinez",
      role: "Tenant",
      content:
        "Casa8 made finding my dream apartment so easy. The search filters and instant messaging with landlords saved me weeks of searching!",
      rating: 5,
    },
    {
      name: "Robert Thompson",
      role: "Landlord",
      content:
        "As a property owner, Casa8 has streamlined my rental process. Managing applications and communicating with tenants has never been easier.",
      rating: 5,
    },
    {
      name: "Lisa Wang",
      role: "Tenant",
      content:
        "The verification process gave me confidence that I was dealing with legitimate landlords. Found my perfect home in just 2 weeks!",
      rating: 5,
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
          <h1 className="text-4xl md:text-6xl font-bold mb-6">About Casa8</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            We're revolutionizing the rental market by connecting landlords and tenants through a seamless, secure, and
            user-friendly platform that makes finding and managing rental properties effortless.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=tenant">
              <Button size="lg">Find Your Home</Button>
            </Link>
            <Link href="/register?role=landlord">
              <Button size="lg" variant="outline">
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Story</h2>
              <p className="text-xl text-muted-foreground">
                Founded in 2016, Casa8 was born from a simple idea: make renting easier for everyone.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold mb-4">The Problem We Solved</h3>
                <p className="text-muted-foreground mb-6">
                  Traditional rental processes were outdated, inefficient, and frustrating for both landlords and
                  tenants. Endless phone calls, paper applications, and lack of transparency made finding and renting
                  properties a time-consuming ordeal.
                </p>

                <h3 className="text-2xl font-semibold mb-4">Our Solution</h3>
                <p className="text-muted-foreground mb-6">
                  Casa8 digitizes and streamlines the entire rental process. From property discovery to lease signing,
                  we've created a platform that saves time, reduces friction, and builds trust between landlords and
                  tenants.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Verified property listings</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Instant communication tools</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Secure online applications</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Comprehensive property management</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Image
                  src="/placeholder.svg?height=400&width=500"
                  alt="Casa8 team working"
                  width={500}
                  height={400}
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Casa8?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We've built features that address real pain points in the rental market, making the process smoother for
              everyone involved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground">The passionate people behind Casa8's success</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      width={128}
                      height={128}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <Badge variant="secondary" className="mt-2">
                    {member.role}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl opacity-90">Don't just take our word for it - hear from our satisfied users</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/10 border-white/20 text-primary-foreground">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <Badge variant="secondary" className="w-fit">
                    {testimonial.role}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm opacity-90">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Our Mission & Values</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Community First</h3>
                <p className="text-muted-foreground">
                  We believe in building strong communities by connecting the right tenants with the right landlords.
                </p>
              </div>

              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Trust & Transparency</h3>
                <p className="text-muted-foreground">
                  Every interaction on our platform is built on trust, with transparent processes and verified
                  information.
                </p>
              </div>

              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Excellence</h3>
                <p className="text-muted-foreground">
                  We strive for excellence in everything we do, continuously improving our platform and services.
                </p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-8">
              <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
              <p className="text-lg text-muted-foreground">
                To revolutionize the rental experience by creating a platform that empowers landlords and tenants with
                the tools, transparency, and trust they need to make informed decisions and build lasting relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of landlords and tenants who have already discovered the Casa8 difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=tenant">
              <Button size="lg">Find Your Home</Button>
            </Link>
            <Link href="/register?role=landlord">
              <Button size="lg" variant="outline">
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
