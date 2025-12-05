'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Beaker, BookCopy, Zap, FileText } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import SpotlightCard from '@/components/SpotlightCard';
import { useRef } from 'react';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <SpotlightCard className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20" spotlightColor="rgba(255, 248, 240, 0.15)">
    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-lg mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-headline font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </SpotlightCard>
);

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div className="text-foreground">
      <main>
        {/* Hero Section */}
        <motion.section
          ref={heroRef}
          style={{
            opacity: heroOpacity,
            scale: heroScale,
            y: heroY
          }}
          className="text-center py-20 md:py-32 relative"
        >
          <div className="container">
            <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter mb-4">
              Accelerate Your Research
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Scholar Summarizer is an AI-powered assistant that helps you discover, analyze, and synthesize scholarly articles from the world's leading academic databases.
            </p>
            <Button asChild size="lg">
              <Link href="/search">
                Start Searching <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </motion.section>

        {/* Features Section */}
        <section className="py-20 ">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-4xl font-headline font-bold">A Smarter Way to Research</h2>
              <p className="text-muted-foreground mt-4">
                From finding papers to generating literature reviews, our powerful AI features streamline your entire workflow.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <FeatureCard
                  icon={<Beaker className="w-6 h-6" />}
                  title="Unified Search"
                  description="Query ArXiv, Semantic Scholar, CrossRef, and CORE simultaneously. Find more papers in less time."
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <FeatureCard
                  icon={<Zap className="w-6 h-6" />}
                  title="AI Summarization"
                  description="Get concise, AI-generated summaries of complex abstracts with a single click."
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <FeatureCard
                  icon={<FileText className="w-6 h-6" />}
                  title="Literature Review Generation"
                  description="Select multiple papers and instantly generate a structured literature review in Markdown format."
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <FeatureCard
                  icon={<BookCopy className="w-6 h-6" />}
                  title="AI Paper Suggestions"
                  description="Discover relevant articles you might have missed with intelligent, context-aware recommendations."
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <FeatureCard
                  icon={<Beaker className="w-6 h-6" />}
                  title="Bookmarking"
                  description="Save interesting papers for later and access them anytime on your dedicated bookmarks page."
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <FeatureCard
                  icon={<Zap className="w-6 h-6" />}
                  title="Citation Helper"
                  description="Instantly generate BibTeX citations for any paper to streamline your reference management."
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="p-8"
              >
                <div className="text-5xl font-bold font-headline text-primary mb-2">4+</div>
                <div className="text-lg font-semibold mb-1">Academic Databases</div>
                <div className="text-muted-foreground text-sm">ArXiv, Semantic Scholar, CrossRef, CORE</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="p-8"
              >
                <div className="text-5xl font-bold font-headline text-primary mb-2">AI-Powered</div>
                <div className="text-lg font-semibold mb-1">Smart Summarization</div>
                <div className="text-muted-foreground text-sm">Using Google Gemini technology</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="p-8"
              >
                <div className="text-5xl font-bold font-headline text-primary mb-2">Instant</div>
                <div className="text-lg font-semibold mb-1">Literature Reviews</div>
                <div className="text-muted-foreground text-sm">Generate comprehensive reviews in seconds</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-4xl font-headline font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground">
                Get started with Scholar Summarizer in three simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="relative"
              >
                <SpotlightCard className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20" spotlightColor="rgba(255, 248, 240, 0.15)">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/20 text-primary rounded-full mb-6 text-2xl font-bold">
                    1
                  </div>
                  <h3 className="text-2xl font-headline font-semibold mb-3">Search</h3>
                  <p className="text-muted-foreground">
                    Enter your research topic and search across multiple academic databases simultaneously
                  </p>
                </SpotlightCard>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <SpotlightCard className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20" spotlightColor="rgba(255, 248, 240, 0.15)">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/20 text-primary rounded-full mb-6 text-2xl font-bold">
                    2
                  </div>
                  <h3 className="text-2xl font-headline font-semibold mb-3">Analyze</h3>
                  <p className="text-muted-foreground">
                    Get AI-powered summaries and discover similar papers with intelligent recommendations
                  </p>
                </SpotlightCard>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <SpotlightCard className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20" spotlightColor="rgba(255, 248, 240, 0.15)">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/20 text-primary rounded-full mb-6 text-2xl font-bold">
                    3
                  </div>
                  <h3 className="text-2xl font-headline font-semibold mb-3">Generate</h3>
                  <p className="text-muted-foreground">
                    Create comprehensive literature reviews from selected papers with a single click
                  </p>
                </SpotlightCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Showcase Section */}
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-6">
                  AI-Powered Literature Reviews
                </div>
                <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6">
                  Generate comprehensive reviews in minutes, not weeks
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Scholar Summarizer's <span className="text-foreground font-semibold">AI Literature Review</span> feature allows you to select multiple papers and instantly generate a structured, comprehensive review.
                </p>
                <p className="text-muted-foreground text-lg mb-8">
                  Once papers are selected, use Scholar Summarizer's powerful AI to synthesize findings, identify patterns, and create publication-ready literature reviews.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-foreground font-semibold">Multi-paper synthesis</span>
                      <p className="text-muted-foreground text-sm">Combine insights from multiple sources automatically</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-foreground font-semibold">Structured output</span>
                      <p className="text-muted-foreground text-sm">Get organized reviews in Markdown format</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-foreground font-semibold">Citation management</span>
                      <p className="text-muted-foreground text-sm">Automatic BibTeX generation for all sources</p>
                    </div>
                  </li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative"
              >
                <SpotlightCard className="p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-md border border-white/20" spotlightColor="rgba(255, 248, 240, 0.15)">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                      <div className="w-10 h-10 bg-primary/30 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Literature Review</div>
                        <div className="text-xs text-muted-foreground">5 papers selected</div>
                      </div>
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">AI</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          whileInView={{ width: "75%" }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          viewport={{ once: true }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">Generating review...</div>
                    </div>
                    <div className="space-y-2 pt-4">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.7 + i * 0.1 }}
                          viewport={{ once: true }}
                          className="h-3 bg-white/5 rounded"
                          style={{ width: `${100 - i * 15}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </SpotlightCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="text-center py-20 md:py-24">
          <div className="container">
            <h2 className="text-4xl font-headline font-bold tracking-tight">
              Ready to Dive In?
            </h2>
            <p className="text-muted-foreground mt-4 mb-8 max-w-xl mx-auto">
              Transform your research process today. Spend less time searching and more time learning.
            </p>
            <Button asChild size="lg">
              <Link href="/search">
                Get Started for Free <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
