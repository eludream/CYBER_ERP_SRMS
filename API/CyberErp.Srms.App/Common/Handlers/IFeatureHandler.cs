namespace CyberErp.Srms.App.Common.Handlers;

public interface IFeatureHandler<TRequest, TResponse>
{
    Task<TResponse> Handle(TRequest request, CancellationToken ct = default);
}