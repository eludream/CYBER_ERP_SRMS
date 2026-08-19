namespace CyberErp.Srms.App.Common.Services
{
    /// <summary>
    /// Interface for managing circuit breaker state
    /// </summary>
    public interface ICircuitBreakerStateProvider
    {
        /// <summary>
        /// Check if a circuit is currently open
        /// </summary>
        bool IsCircuitOpen(string circuitName, out DateTimeOffset openUntil);

        /// <summary>
        /// Mark a circuit as open
        /// </summary>
        void MarkCircuitOpen(string circuitName, DateTimeOffset openUntil);

        /// <summary>
        /// Mark a circuit as closed (reset)
        /// </summary>
        void MarkCircuitClosed(string circuitName);

        /// <summary>
        /// Record a successful operation (for half-open state)
        /// </summary>
        void RecordSuccess(string circuitName);

        /// <summary>
        /// Record a failed operation
        /// </summary>
        void RecordFailure(string circuitName);

        /// <summary>
        /// Reset all circuit breaker states
        /// </summary>
        void ResetAll();
    }
}

