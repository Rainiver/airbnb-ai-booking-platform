// AI Response Templates (English)

export const responses = {
  // No results
  noResults: `Sorry, I couldn't find any properties matching your criteria. Try different keywords like:

• "Beach houses"
• "Budget-friendly properties"
• "Family-friendly large houses"
• "Luxury villas with pool"

You can also:
• Specify dates: "What's available Jan 1st to 7th"
• Ask about pricing: "When is the best time to book"
• Book directly: "Book [property name]"`,

  // General error
  generalError: `Sorry, I encountered an issue processing your request. Please try again or rephrase your question.

Common queries:
• "Find beach houses"
• "What's available Jan 1-7"
• "When is the cheapest time to book"`,

  // Price predict error
  pricePredictError: 'Sorry, an error occurred during price prediction. Please try again.',

  // Date check error
  dateCheckError: 'Sorry, an error occurred while checking dates. Please try again.',

  // Booking error
  bookingError: 'Sorry, an error occurred processing the booking. Please try again.',

  // Listing not found
  listingNotFound: (title: string) => `😕 Sorry, I couldn't find a property named "${title}".\n\n💡 Please search for properties first, then tell me which one you'd like to book.`,

  // Listing not found with suggestions
  listingNotFoundWithSuggestions: (title: string, suggestions: string[]) => {
    let msg = `😕 Sorry, I couldn't find a property named "${title}".\n\n📋 From your previous search:\n\n`;
    suggestions.forEach((s, idx) => {
      msg += `${idx + 1}. ${s}\n`;
    });
    msg += `\n💡 Please tell me: "Book [property name]"`;
    return msg;
  },

  // Booking prompt
  bookingPrompt: `🎫 Booking Assistant:\n\nPlease search for properties first, then tell me:\n\n"Book [property name]"\n\nFor example: "Book Luxury Villa 1"`,

  // Success messages
  foundListings: (count: number) => `🎉 I found ${count} perfect ${count === 1 ? 'property' : 'properties'} for you!\n\n💡 Click on the property cards below to view details and book\n🔍 You can ask: "Which is the cheapest" or "When is the best time to book"`,

  foundListingsWithContext: (count: number) => `🔄 Based on your previous search, I filtered ${count} ${count === 1 ? 'property' : 'properties'}:\n\n💡 Click on the property cards below\n🔍 Keep asking: "Which is cheapest" or "Best time to book"`,

  // Date check success
  dateCheckSuccess: (checkIn: string, checkOut: string, count: number) => 
    `📅 Date Query Results:\n\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\n\n✅ Found ${count} available ${count === 1 ? 'property' : 'properties'}!\n\n💡 Click property cards to view details`,

  // Price analysis - single listing
  singleListingPriceAnalysis: (listing: any) => {
    let msg = `🎯 Price Analysis for ${listing.title}:\n\n`;
    
    if (listing.priceInfo) {
      msg += `💰 Base Price: $${listing.priceInfo.currentPrice}/night\n\n`;
      msg += `📊 **Best Time to Book Recommendations**:\n\n`;
      
      if (listing.priceInfo.priceTrend.includes('Early')) {
        msg += `✅ **Book Now**: Early bird discount (-5%)\n`;
        msg += `   Predicted: $${listing.priceInfo.predictedPrice}/night\n\n`;
        msg += `📅 Summer (Jun-Sep): Price +30%\n`;
        msg += `📅 Weekends: Price +15%\n`;
        msg += `📅 Last minute (< 7 days): Possible discount -10%\n\n`;
        msg += `💡 **Recommendation**: Book early to lock in the discount!`;
      } else if (listing.priceInfo.priceTrend.includes('peak')) {
        msg += `⚠️ **Peak Season**: Prices increased 30%\n`;
        msg += `   Current: $${listing.priceInfo.predictedPrice}/night (+${listing.priceInfo.priceChange})\n\n`;
        msg += `💡 **Recommendation**: Consider off-season for 30% savings`;
      } else if (listing.priceInfo.priceTrend.includes('Weekend')) {
        msg += `⚠️ **Weekend Premium**: Fri/Sat prices +15%\n`;
        msg += `   Predicted: $${listing.priceInfo.predictedPrice}/night\n\n`;
        msg += `💡 **Recommendation**: Book Sun-Thu for 15% savings`;
      } else if (listing.priceInfo.priceTrend.includes('Last')) {
        msg += `🎉 **Last-Minute Deal**: Booking < 7 days gets -10%\n`;
        msg += `   Discount Price: $${listing.priceInfo.predictedPrice}/night\n\n`;
        msg += `💡 **Recommendation**: Wait for last-minute deals if flexible!`;
      } else {
        msg += `➡️ Price is relatively stable\n`;
        msg += `   Current: $${listing.priceInfo.predictedPrice}/night\n\n`;
        msg += `💡 **Recommendation**: Stable pricing, book anytime`;
      }
    }
    
    msg += `\n\n🎯 **Ready to book?** Tell me: "Book ${listing.title}, [check-in date]"`;
    return msg;
  },

  // Price analysis - multiple listings
  multipleListingsPriceAnalysis: (listings: any[], hasContext: boolean) => {
    let msg = `📊 Price Trend Analysis:\n\n`;
    
    if (hasContext) {
      msg += `Based on your previous search, analyzed ${listings.length} ${listings.length === 1 ? 'property' : 'properties'}:\n\n`;
    } else {
      msg += `I analyzed ${listings.length} ${listings.length === 1 ? 'property' : 'properties'}:\n\n`;
    }
    
    return msg;
  },

  // Booking confirmation
  bookingConfirmation: (listing: any, checkIn?: Date, checkOut?: Date) => {
    let msg = `✅ Great! Let me help you book:\n\n`;
    msg += `🏠 **${listing.title}**\n`;
    msg += `📍 ${listing.locationValue}\n\n`;
    
    if (checkIn && checkOut) {
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      msg += `📅 Check-in: ${checkIn.toLocaleDateString()}\n`;
      msg += `📅 Check-out: ${checkOut.toLocaleDateString()}\n`;
      msg += `🌙 ${nights} ${nights === 1 ? 'night' : 'nights'}\n\n`;
      
      if (listing.priceInfo) {
        msg += `💰 Price: $${listing.priceInfo.predictedPrice}/night\n`;
        msg += `📊 ${listing.priceInfo.priceTrend}\n`;
        msg += `💵 Total: $${listing.totalPrice}\n\n`;
      }
    } else {
      msg += `⚠️ No check-in date selected!\n\n`;
      msg += `Please tell me:\n`;
      msg += `"Book ${listing.title}, Jan 1st to 7th"\n\n`;
    }

    msg += `🎯 **Next Step**:\nClick the property card below to complete your booking.`;
    
    return msg;
  },

  // Booking unavailable
  bookingUnavailable: (listing: any, bookingInfo: string) => 
    `😔 Sorry, ${listing.title} is not available for your selected dates.\n\n📅 ${bookingInfo}\n\n💡 Try different dates or check other properties?`,
};

// Helper function to format listing in message
export function formatListingInMessage(listing: any, index: number): string {
  const trend = listing.priceInfo?.priceChange.startsWith('+') ? '📈' : 
               listing.priceInfo?.priceChange.startsWith('-') ? '📉' : '➡️';
  
  let msg = `${index + 1}. ${listing.title}\n`;
  
  if (listing.priceInfo) {
    msg += `   ${trend} ${listing.priceInfo.priceTrend}\n`;
    msg += `   Was $${listing.priceInfo.currentPrice} → Now $${listing.priceInfo.predictedPrice}/night\n\n`;
  } else {
    msg += `   $${listing.price}/night\n\n`;
  }
  
  return msg;
}
