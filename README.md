# FitCheck AI

## Live Demo

https://fitcheck-ai-psi.vercel.app

## Overview

FitCheck AI is an AI-inspired fitness analytics and coaching platform built with Next.js, React, TypeScript, Tailwind CSS, and Recharts.

The app helps users track bodyweight, calories, protein, steps, workouts, exercises, and strength performance while generating personalized coaching insights for cutting, bulking, and maintaining.

## Features

* Daily weight logging
* Calorie tracking
* Protein tracking
* Step tracking
* Workout tracking
* Exercise tracking with sets, reps, and weight
* 7-day and 14-day moving averages
* Weight trend charts
* Steps trend charts
* Goal weight tracking
* Goal date tracking
* Projected goal date
* Goal pace analysis
* AI Coach Report
* Weekly Report Generator
* Strength Analytics
* Workout volume analysis
* Plateau Detection Agent
* Goal Feasibility Agent
* Weekly AI Review
* Local storage persistence
* Saved user settings
* Edit and delete logs

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Recharts
* localStorage
* Vercel
* GitHub

## AI / Agent Logic

FitCheck AI uses rule-based agent logic to analyze user data and generate coaching recommendations.

The app currently evaluates:

* Weight trend
* Protein consistency
* Step average
* Goal feasibility
* Weekly progress
* Exercise volume
* Strength performance
* Plateau risk
* Goal timeline realism
* Weekly trend analysis
* Cutting, bulking, or maintaining status

### Plateau Detection Agent (Day 12)

Analyzes 7-day and 14-day weight averages to identify potential weight-loss plateaus and provide recommendations before users make unnecessary calorie adjustments.

### Goal Feasibility Agent (Day 13)

Compares current weight-loss pace to the pace required to reach a goal by a target date.

Evaluates:

* Current loss rate
* Required loss rate
* Days remaining
* Pounds remaining
* Goal feasibility score
* Goal realism verdict
* Personalized recommendation

### Weekly AI Review (Day 14)

Provides a weekly summary of progress including:

* Weekly weight change
* Average calories
* Average protein
* Average steps
* Weekly trend classification
* Goal status
* Primary action recommendation for the upcoming week

### Day 14 Improvements

* Fixed analytics so unsaved form inputs no longer affect dashboard calculations
* Goal calculations now use the latest saved weight
* Strength analytics ignore rest days
* Workout volume comparisons only use actual workout sessions
* Improved stability and consistency of coaching insights

## Future Improvements

* UI/UX redesign
* Ask FitCheck AI chat interface
* Natural language AI coach
* LLM integration
* Personalized AI recommendations
* AI fitness agent tools
* Mobile app version
* Cloud database
* User accounts
* Apple Health integration
* Garmin integration
* Fitbit integration
* Wearable device support

## Current Status

Actively under development.

### Development Progress

✅ Day 1–11 Complete

✅ Day 12: Plateau Detection Agent

✅ Day 13: Goal Feasibility Agent

✅ Day 14: Weekly AI Review

🔄 Next Milestone: Ask FitCheck AI

🎯 Long-Term Goal: Transform FitCheck AI into a true AI-powered fitness coaching agent capable of analyzing user fitness data and generating personalized recommendations using LLM-based reasoning.
