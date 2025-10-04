import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Rocket, ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <Card className="max-w-4xl mx-auto p-12 bg-card/50 backdrop-blur-sm border-primary/20">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Rocket className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">Ready for Launch?</h2>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Join thousands of Bitcoin holders earning yield on Starknet. Your mission starts now.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 group"
              >
                Board Shuttle Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-border hover:bg-secondary bg-transparent"
              >
                Read Documentation
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
