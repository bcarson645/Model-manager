using System.Diagnostics.CodeAnalysis;
using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Lookups;

namespace PremiumCricket.Lib.Pricing.PricingModels;

[ExcludeFromCodeCoverage]
public abstract class HomeAwayMarketPricingModel : MarketPricingModel<IPricingInputs>
{
    protected HomeAwayMarketPricingModel(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }
        
    /// <summary>
    /// Returns the market id for the home team.
    /// </summary>
    /// <returns>int</returns>
    public abstract int GetHomeMarketId();
        
    /// <summary>
    /// Returns the market id for the away team.
    /// </summary>
    /// <returns>int</returns>
    public abstract int GetAwayMarketId();
        
    /// <summary>
    /// Returns the market id for either the home or away team.
    /// </summary>
    /// <param name="isHomeTeam"></param>
    /// <returns>int</returns>
    public int GetMarketId(bool isHomeTeam) => isHomeTeam ? GetHomeMarketId() : GetAwayMarketId();
        
    /// <summary>
    /// Return the legacy market id.
    /// </summary>
    /// <remarks>
    /// Returns the default value of 0 unless overridden by a derived class.
    /// </remarks>
    /// <returns>int</returns>
    public virtual int GetLegacyMarketId() => 0;

    /// <summary>
    /// Returns the market ids for both home and away teams.
    /// </summary>
    /// <returns></returns>
    public override List<int> GetMarketIds() => new()
    {
        GetHomeMarketId(),
        GetAwayMarketId()
    };
}
