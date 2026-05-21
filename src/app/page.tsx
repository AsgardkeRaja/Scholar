'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search, Upload, Sparkles, Brain, Zap, FileText, Coffee, Beaker, BookCopy } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import SpotlightCard from '@/components/SpotlightCard';
import { useRef } from 'react';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <SpotlightCard className="p-8 rounded-2xl glass-panel" spotlightColor="rgba(208, 188, 255, 0.12)">
    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-xl mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-headline font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
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
          className="text-center py-24 md:py-36 relative overflow-hidden"
        >
          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block px-5 py-2.5 glass-panel rounded-full text-sm font-semibold mb-8 text-primary"
            >
              ✨ Your research sidekick is here
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold font-headline tracking-tighter mb-6"
            >
              Stop drowning in papers.
              <br />
              <span className="gradient-text">
                Start discovering insights.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              The research is like having a PhD student who actually reads everything, never complains, and works 24/7.
              Search millions of papers, get AI summaries, and generate literature reviews faster than you can say &quot;peer review.&quot;
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button asChild size="lg" className="text-base px-8 rounded-full bg-primary/90 text-primary-foreground hover:bg-primary shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30">
                <Link href="/search">
                  Start Searching <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8 rounded-full border-white/15 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-200">
                <Link href="/upload">
                  Upload Papers <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm text-muted-foreground mt-8"
            >
              No sign-up required. No credit card. Just pure research power.
            </motion.p>
          </div>
        </motion.section>

        {/* The Problem Section */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6">
                  We know the struggle
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  You&apos;ve got 47 tabs open, your coffee&apos;s gone cold, and you&apos;re still on page 2 of that abstract...
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: <Coffee className="w-8 h-8" />, title: "Hours wasted", desc: "Searching across multiple databases" },
                  { icon: <Brain className="w-8 h-8" />, title: "Information overload", desc: "Too many papers, not enough time" },
                  { icon: <FileText className="w-8 h-8" />, title: "Boring summaries", desc: "Reading the same intro 50 times" }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center p-6 rounded-2xl glass-panel"
                  >
                    <div className="flex items-center justify-center w-14 h-14 bg-primary/10 text-primary rounded-xl mx-auto mb-4">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 font-headline">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-4xl font-headline font-bold">A Smarter Way to Research</h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                From finding papers to generating literature reviews, our powerful AI features streamline your entire workflow.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <Beaker className="w-6 h-6" />, title: "Unified Search", description: "Query ArXiv, Semantic Scholar, CrossRef, and CORE simultaneously. Find more papers in less time.", delay: 0 },
                { icon: <Zap className="w-6 h-6" />, title: "AI Summarization", description: "Get concise, AI-generated summaries of complex abstracts with a single click.", delay: 0.1 },
                { icon: <FileText className="w-6 h-6" />, title: "Literature Review Generation", description: "Select multiple papers and instantly generate a structured literature review in Markdown format.", delay: 0.2 },
                { icon: <BookCopy className="w-6 h-6" />, title: "AI Paper Suggestions", description: "Discover relevant articles you might have missed with intelligent, context-aware recommendations.", delay: 0.3 },
                { icon: <Beaker className="w-6 h-6" />, title: "Bookmarking", description: "Save interesting papers for later and access them anytime on your dedicated bookmarks page.", delay: 0.4 },
                { icon: <Zap className="w-6 h-6" />, title: "Citation Helper", description: "Instantly generate BibTeX citations for any paper to streamline your reference management.", delay: 0.5 },
              ].map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: feat.delay }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <FeatureCard
                    icon={feat.icon}
                    title={feat.title}
                    description={feat.description}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                { value: "4+", label: "Academic Databases", sub: "ArXiv, Semantic Scholar, CrossRef, CORE" },
                { value: "AI-Powered", label: "Smart Summarization", sub: "Using Google Gemini technology" },
                { value: "Instant", label: "Literature Reviews", sub: "Generate comprehensive reviews in seconds" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-2xl glass-panel"
                >
                  <div className="text-5xl font-bold font-headline gradient-text mb-3">{stat.value}</div>
                  <div className="text-lg font-semibold mb-1">{stat.label}</div>
                  <div className="text-muted-foreground text-sm">{stat.sub}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-4xl font-headline font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground leading-relaxed">
                Get started with The research in three simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { num: "1", title: "Search", desc: "Enter your research topic and search across multiple academic databases simultaneously" },
                { num: "2", title: "Analyze", desc: "Get AI-powered summaries and discover similar papers with intelligent recommendations" },
                { num: "3", title: "Generate", desc: "Create comprehensive literature reviews from selected papers with a single click" },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <SpotlightCard className="p-8 rounded-2xl glass-panel" spotlightColor="rgba(208, 188, 255, 0.12)">
                    <div className="flex items-center justify-center w-16 h-16 bg-primary/15 text-primary rounded-full mb-6 text-2xl font-bold font-headline border border-primary/20">
                      {step.num}
                    </div>
                    <h3 className="text-2xl font-headline font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                  </SpotlightCard>
                </motion.div>
              ))}
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
                <div className="inline-block px-4 py-2 glass-panel rounded-full text-sm font-semibold mb-6 text-accent">
                  AI-Powered Literature Reviews
                </div>
                <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6">
                  Generate comprehensive reviews in <span className="gradient-text">minutes, not weeks</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  The research&apos;s <span className="text-foreground font-semibold">AI Literature Review</span> feature allows you to select multiple papers and instantly generate a structured, comprehensive review.
                </p>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Once papers are selected, use The research&apos;s powerful AI to synthesize findings, identify patterns, and create publication-ready literature reviews.
                </p>
                <ul className="space-y-4">
                  {[
                    { title: "Multi-paper synthesis", desc: "Combine insights from multiple sources automatically" },
                    { title: "Structured output", desc: "Get organized reviews in Markdown format" },
                    { title: "Citation management", desc: "Automatic BibTeX generation for all sources" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-foreground font-semibold">{item.title}</span>
                        <p className="text-muted-foreground text-sm">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative"
              >
                <SpotlightCard className="p-8 rounded-2xl glass-panel glass-panel-glow" spotlightColor="rgba(78, 222, 163, 0.1)">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Literature Review</div>
                        <div className="text-xs text-muted-foreground">5 papers selected</div>
                      </div>
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                        <span className="text-accent-foreground text-xs font-bold">AI</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-accent"
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto p-12 rounded-3xl glass-panel glass-panel-glow"
            >
              <h2 className="text-4xl font-headline font-bold tracking-tight">
                Ready to <span className="gradient-text">Dive In?</span>
              </h2>
              <p className="text-muted-foreground mt-4 mb-8 max-w-xl mx-auto leading-relaxed">
                Transform your research process today. Spend less time searching and more time learning.
              </p>
              <Button asChild size="lg" className="rounded-full bg-primary/90 text-primary-foreground hover:bg-primary shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30">
                <Link href="/search">
                  Get Started for Free <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}