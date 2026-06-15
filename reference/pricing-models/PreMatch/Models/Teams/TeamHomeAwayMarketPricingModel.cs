using PremiumCricket.Lib.Pricing.Inputs;
using PremiumCricket.Lib.Pricing.Inputs.Evaluations;
using PremiumCricket.Lib.Pricing.Lookups;
using PremiumCricket.Lib.Models.PricingOutputs;
using PremiumCricket.Lib.Models.PricingOutputs.Specifiers;

namespace PremiumCricket.Lib.Pricing.PricingModels.PreMatch.Models.Teams;

public abstract class TeamHomeAwayMarketPricingModel : HomeAwayMarketPricingModel
{
    protected int HomeMarketId { get; init; }
    protected int AwayMarketId { get; init; }
    protected int LegacyMarketId { get; init; }

    protected TeamHomeAwayMarketPricingModel(ILookupProvider lookupProvider) : base(lookupProvider)
    {
    }

    public override int GetHomeMarketId() => HomeMarketId;

    public override int GetAwayMarketId() => AwayMarketId;

    public override int GetLegacyMarketId() => LegacyMarketId;

    protected static List<Specifier> GetHomeAwaySpecifiers(IPricingInputs inputs, TeamEvaluation team, int line)
    {
        return new List<Specifier>
        {
            new MaxOverSpecifier(GetInitialOversForFormat(inputs.Evaluation.MatchEvaluation.Format)),
            new TeamSpecifier($"{team.TeamName}|{team.TeamId}"),
            new LineSpecifier(line + 0.5)
        };
    }
    
    protected static List<Specifier> GetTeamInningsSpecifiers(IPricingInputs inputs, TeamEvaluation team)
    {
        return new List<Specifier>
        {
            new MaxOverSpecifier(GetInitialOversForFormat(inputs.Evaluation.MatchEvaluation.Format)),
            new TeamSpecifier($"{team.TeamName}|{team.TeamId}"),
            new InningsSpecifier(1)
        };
    }

    protected Market CreateMarket(IPricingInputs inputs, TeamEvaluation team, double underProb, int line, string marketCode)
    {
        string marketName = GetMarketName(team);

        if (inputs.Evaluation.MatchEvaluation.IsTestOrFirstClass)
        {
            marketName = $"{team.TeamName} 1st {GetMarketName()}";
            if (!GetMarketName().StartsWith("Innings"))
            {
                marketName = $"{team.TeamName} 1st Innings {GetMarketName()}";
            }
        }
        return new(
            marketName,
            GetMarketId(team.IsHomeTeam),
            GetLegacyMarketId(),
            GetOverUnderOutcomes(underProb),
            GetHomeAwaySpecifiers(inputs, team, line),
            GetMarketCode(team, marketCode));
    }

    protected string GetMarketName(TeamEvaluation team) => $"{team.TeamName} {GetMarketName()}";

    protected static string GetMarketCode(TeamEvaluation team, string code) => $"{(team.IsHomeTeam ? 5 : 6)}{code}";
}
