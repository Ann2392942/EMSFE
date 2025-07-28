// src/app/components/user/tickets/tickets.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TicketService, Ticket } from '../../../services/ticket.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css']
})
export class TicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  loading = false;
  error = '';
  selectedFilter = 'all';

  constructor(
    private ticketService: TicketService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.loading = true;
    this.error = '';

    this.ticketService.getUserTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.error = 'Failed to load tickets';
        this.loading = false;
      }
    });
  }

  applyFilter() {
    switch (this.selectedFilter) {
      case 'confirmed':
        this.filteredTickets = this.tickets.filter(t =>
          t.status === 'Confirmed' || t.bookingStatus === 'Confirmed'
        );
        break;
      case 'cancelled':
        this.filteredTickets = this.tickets.filter(t =>
          t.status === 'Cancelled' || t.bookingStatus === 'Cancelled'
        );
        break;
      case 'upcoming':
        this.filteredTickets = this.tickets.filter(t => {
          const eventDate = new Date(t.eventStartDate);
          const now = new Date();
          return eventDate > now && (t.status === 'Confirmed' || t.bookingStatus === 'Confirmed');
        });
        break;
      case 'past':
        this.filteredTickets = this.tickets.filter(t => {
          const eventDate = new Date(t.eventEndDate);
          const now = new Date();
          return eventDate < now;
        });
        break;
      default:
        this.filteredTickets = [...this.tickets];
    }
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  viewTicket(ticketId: number) {
    this.router.navigate(['/user/tickets', ticketId]);
  }

  // ADDED: Public method to navigate to events
  browseEvents() {
    this.router.navigate(['/user/events']);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bi bi-check-circle-fill text-success';
      case 'cancelled':
        return 'bi bi-x-circle-fill text-danger';
      default:
        return 'bi bi-clock-fill text-warning';
    }
  }

  getTotalAmount(ticket: Ticket): number {
    return ticket.eventPrice * ticket.ticketCount;
  }

  getTicketsSummary() {
    const confirmed = this.tickets.filter(t => t.status === 'Confirmed').length;
    const cancelled = this.tickets.filter(t => t.status === 'Cancelled').length;
    const totalSpent = this.tickets
      .filter(t => t.status === 'Confirmed')
      .reduce((sum, t) => sum + (t.eventPrice * t.ticketCount), 0);

    return { confirmed, cancelled, totalSpent };
  }
}
