// src/app/components/user/tickets/view-ticket/view-ticket.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService, Ticket } from '../../../../services/ticket.service';

@Component({
  selector: 'app-view-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-ticket.component.html',
  styleUrls: ['./view-ticket.component.css']
})
export class ViewTicketComponent implements OnInit {
  ticket: Ticket | null = null;
  ticketId: number = 0;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService
  ) {}

  ngOnInit() {
    this.ticketId = parseInt(this.route.snapshot.paramMap.get('id') || '0');
    if (this.ticketId) {
      this.loadTicket();
    }
  }

  loadTicket() {
    this.loading = true;
    this.error = '';

    this.ticketService.getTicketById(this.ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading ticket:', error);
        this.error = 'Failed to load ticket details';
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/user/tickets']);
  }

  formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalAmount(): number {
    return this.ticket ? this.ticket.eventPrice * this.ticket.ticketCount : 0;
  }

  getStatusClass(): string {
    if (!this.ticket) return '';

    switch (this.ticket.status.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getStatusIcon(): string {
    if (!this.ticket) return '';

    switch (this.ticket.status.toLowerCase()) {
      case 'confirmed':
        return 'bi bi-check-circle-fill text-success';
      case 'cancelled':
        return 'bi bi-x-circle-fill text-danger';
      default:
        return 'bi bi-clock-fill text-warning';
    }
  }
}
