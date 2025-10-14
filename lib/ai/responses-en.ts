// Complete English Response System for AI Chat

export class AIResponses {
  // Search responses
  static foundListings(count: number, isFollowUp: boolean = false): string {
    if (isFollowUp) {
      return `🔄 Based on your previous search, I filtered ${count} perfect ${count === 1 ? 'property' : 'properties'}:\n\n💡 Click property cards below for details\n🔍 Ask me: "Which is cheapest?" or "Best time to book?"`;
    }
    return `🎉 I found ${count} perfect ${count === 1 ? 'property' : 'properties'} for you!\n\n💡 Click property cards below for details and booking\n🔍 Ask me: "Which is cheapest?" or "Best time to book?"`;
  }

  static noResults(): string {
    return `Sorry, I couldn't find properties matching your criteria. Try:\n\n• "Beach houses"\n• "Budget-friendly properties"\n• "Large family houses"\n• "Luxury villas with pool"\n\nYou can also:\n• Specify dates: "What's available Jan 1-7"\n• Ask pricing: "When to book cheapest"\n• Book directly: "Book [property name]"`;
  }

  static generalError(): string {
    return `Sorry, I encountered an issue. Please try again or rephrase.\n\nCommon queries:\n• "Find beach houses"\n• "Available Jan 1-7?"\n• "When is cheapest time to book"`;
  }

  // Date check responses
  static dateCheckResult(checkIn: Date, checkOut: Date, count: number): string {
    return `📅 Date Availability Results:\n\nCheck-in: ${checkIn.toLocaleDateString()}\nCheck-out: ${checkOut.toLocaleDateString()}\n\n✅ Found ${count} available ${count === 1 ? 'property' : 'properties'}!\n\n💡 Click cards to view details`;
  }

  // Price prediction responses
  static priceAnalysis Detailed(listing: any): string {
    let msg = `🎯 Price Analysis: ${listing.title}\n\n`;
    
    if (!listing.priceInfo) {
      return msg + `💰 Base Price: $${listing.price}/night\n\n💡 No price changes expected`;
    }

    msg += `💰 Base Price: $${listing.priceInfo.currentPrice}/night\n\n`;
    msg += `📊 **Best Time to Book**:\n\n`;
    
    const trend = listing.priceInfo.priceTrend.toLowerCase();
    
    if (trend.includes('early') || trend.includes('advance')) {
      msg += `✅ Book Now - Early bird discount\n`;
      msg += `   Price: $${listing.priceInfo.predictedPrice}/night (${listing.priceInfo.priceChange})\n\n`;
      msg += `📅 Summer (Jun-Sep): +30%\n`;
      msg += `📅 Weekends: +15%\n`;
      msg += `📅 Last minute (<7 days): -10%\n\n`;
      msg += `💡 Lock in the discount by booking early!`;
    } else if (trend.includes('peak') || trend.includes('high season')) {
      msg += `⚠️ Peak Season Pricing (+30%)\n`;
      msg += `   Current: $${listing.priceInfo.predictedPrice}/night\n\n`;
      msg += `💡 Book off-season to save 30%`;
    } else if (trend.includes('weekend')) {
      msg += `⚠️ Weekend Premium (+15%)\n`;
      msg += `   Fri/Sat: $${listing.priceInfo.predictedPrice}/night\n\n`;
      msg += `💡 Book Sun-Thu to save 15%`;
    } else if (trend.includes('last') || trend.includes('minute')) {
      msg += `🎉 Last-Minute Deal (-10%)\n`;
      msg += `   Sale Price: $${listing.priceInfo.predictedPrice}/night\n\n`;
      msg += `💡 Wait for deals if flexible!`;
    } else {
      msg += `➡️ Stable Pricing\n`;
      msg += `   Current: $${listing.priceInfo.predictedPrice}/night\n\n`;
      msg += `💡 Book anytime - price is stable`;
    }
    
    msg += `\n\n🎯 Ready? Say: "Book ${listing.title}, [dates]"`;
    return msg;
  }

  static priceAnalysisMultiple(listings: any[], hasContext: boolean): string {
    let msg = `📊 Price Trend Analysis:\n\n`;
    
    if (hasContext) {
      msg += `Based on previous search - ${listings.length} properties:\n\n`;
    } else {
      msg += `Analyzed ${listings.length} properties:\n\n`;
    }
    
    listings.forEach((listing, idx) => {
      if (listing.priceInfo) {
        const trend = listing.priceInfo.priceChange.startsWith('+') ? '📈' : 
                     listing.priceInfo.priceChange.startsWith('-') ? '📉' : '➡️';
        msg += `${idx + 1}. ${listing.title}\n`;
        msg += `   ${trend} ${listing.priceInfo.priceTrend}\n`;
        msg += `   Was $${listing.priceInfo.currentPrice} → Now $${listing.priceInfo.predictedPrice}/night\n\n`;
      }
    });

    msg += `💡 Click cards for details`;
    return msg;
  }

  // Booking responses
  static bookingPrompt(): string {
    return `🎫 Booking Assistant:\n\nSearch for properties first, then:\n\n"Book [property name]"\n\nExample: "Book Luxury Villa 1"`;
  }

  static listingNotFound(title: string, suggestions?: string[]): string {
    let msg = `😕 Sorry, couldn't find "${title}".\n\n`;
    
    if (suggestions && suggestions.length > 0) {
      msg += `📋 From your search:\n\n`;
      suggestions.forEach((s, idx) => {
        msg += `${idx + 1}. ${s}\n`;
      });
      msg += `\n💡 Tell me: "Book [property name]"`;
    } else {
      msg += `💡 Search first, then book.`;
    }
    
    return msg;
  }

  static bookingConfirm(listing: any, checkIn?: Date, checkOut?: Date): string {
    let msg = `✅ Perfect! Booking ${listing.title}:\n\n`;
    msg += `🏠 **${listing.title}**\n`;
    msg += `📍 ${listing.locationValue}\n\n`;
    
    if (checkIn && checkOut) {
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      msg += `📅 Check-in: ${checkIn.toLocaleDateString()}\n`;
      msg += `📅 Check-out: ${checkOut.toLocaleDateString()}\n`;
      msg += `🌙 ${nights} ${nights === 1 ? 'night' : 'nights'}\n\n`;
      
      if (listing.priceInfo) {
        msg += `💰 Rate: $${listing.priceInfo.predictedPrice}/night\n`;
        msg += `📊 ${listing.priceInfo.priceTrend}\n`;
        msg += `💵 Total: $${listing.totalPrice}\n\n`;
      }
    } else {
      msg += `⚠️ No dates selected!\n\n`;
      msg += `Please specify:\n"Book ${listing.title}, Jan 1-7"\n\n`;
    }

    msg += `🎯 Click the property card to complete booking.`;
    
    return msg;
  }

  static bookingUnavailable(listing: any, info: string): string {
    return `😔 Sorry, ${listing.title} unavailable for selected dates.\n\n📅 ${info}\n\n💡 Try different dates or other properties?`;
  }
}

export default AIResponses;
